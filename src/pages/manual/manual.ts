import { Component, ViewChild } from '@angular/core';
import { ActionSheetController, AlertController, LoadingController, NavController  } from 'ionic-angular';
import { ConfigService } from '../../providers/config.service';
import { Ingenico } from '../../providers/ingenico';
import {
    Amount,
    CashSaleTransactionRequest,
    CreditSaleTransactionRequest,
    DebitSaleTransactionRequest,
    Device,
    DeviceType
} from '../../providers/ingenico/models';
import { HomePage } from '../pages';


@Component({
    selector    : 'manual-page',
    templateUrl : 'manual.html'
})

export class ManualPage {

    @ViewChild('orderForm') form;

    logStyle         : string ;
    debug            : boolean;
    request          : any;
    devices          : Device[];
    currency         : string    = "USD";
    quantity         : string    = "1";
    subtotal         : any       = 0;
    tax              : any       = 0;
    total            : any       = 0;
    discount         : any       = 0;
    productID        : number    = 0;
    productVal       : any       = 0;
    productName      : string    = "";
    taxValue         : any       = 0.07;
    deviceConnected  : boolean   = false;
    processingCharge : boolean   = false;
    loggedIn         : boolean   = false;
    productInventory : Array<any> = [
        {id:0,name:"PRODUCT #1",price:1.00},
        {id:1,name:"PRODUCT #2",price:1.50},
        {id:2,name:"PRODUCT #3",price:2.00}
    ];

    constructor(
        public alertCtrl: AlertController,
        public actionSheetCtrl: ActionSheetController,
        public configService: ConfigService,
        public ingenico: Ingenico,
        public loadingCtrl: LoadingController,
        public navCtrl: NavController
    ){
        this.debug     = this.configService.getDebug();
        this.logStyle  = this.configService.getLogStyles().pages;
        if (this.debug) {console.log(`%cManual.constructor()`,this.logStyle);}
        this.updateValues();
    }

    login(){
        if (this.debug) {console.log(`%cManual.login()`,this.logStyle);}
        if (!this.loggedIn){
            let ingenicoConfig = this.configService.getIngenicoConfig();
            // create and present loading notification
            let loading = this.loadingCtrl.create({
                content : 'Processing Login ...'
            });
            loading.present();
            this.ingenico.login(ingenicoConfig.username, ingenicoConfig.password, ingenicoConfig.apiKey, ingenicoConfig.baseUrl, ingenicoConfig.clientVersion)
                .then(result => {
                    if (this.debug) {console.log(`%cManual.login()->ingenico.login()`,this.logStyle,result);}
                    loading.dismiss();
                    this.loggedIn = true;
                    this.setDeviceTypeAndSearch();
                })
                .catch(error => {
                    loading.dismiss();
                    this.alert(`ERROR : ${error}`);
                });
        }
        else {
            this.setDeviceTypeAndSearch();
        }
    }

    processCharge(type) {
        if (this.debug) {console.log(`%cManual.processCharge(${type})`,this.logStyle);}
        let amount = new Amount(this.currency, this.total*100, this.subtotal*100, this.tax*100, this.discount*100, "", 0),
            notes  = `This is a transaction note from Manual.processCharge(${type})`;

        this.processingCharge = true;

        if (type === 'cash') {
            this.request = new CashSaleTransactionRequest(amount, null, notes);
            this.ingenico.processCashTransaction(this.request)
                .then(result => {
                    if (this.debug) {console.log(`%c\tCashPurchaseResponse`,this.logStyle,result);}
                    this.alert(result.transactionResponseCode === 1 ? 'Cash Purchase Complete' : 'Cash Purchase Failed');
                    this.processingCharge = false;
                }).catch(error => {
                    if (error !== "4945")
                        this.alert("ERROR: " + error);
                    this.processingCharge = false;
                });
        }
        else if (type === 'credit') {
            this.request = new CreditSaleTransactionRequest(amount, null, notes);
            this.ingenico.processCreditSaleTransactionWithCardReader(this.request)
                .then(result => {
                    if (this.debug) {console.log(`%c\tCreditCardPurchaseResponse`,this.logStyle,result);}
                    this.alert(result.transactionResponseCode === 1 ? 'Credit Purchase Complete' : 'Credit Purchase Failed');
                    this.processingCharge = false;
                }).catch(error => {
                    if (error !== "4945")
                        this.alert("ERROR: " + error);
                    this.processingCharge = false;
                });
        }
        else {
            this.request = new DebitSaleTransactionRequest(amount, null, notes);
            this.ingenico.processDebitSaleTransactionWithCardReader(this.request)
                .then(result => {
                    if (this.debug) {console.log(`%c\tDebitPurchaseResponse`,this.logStyle,result);}
                    this.alert(result.transactionResponseCode === 1 ? 'Debit Purchase Complete' : 'Debit Purchase Failed');
                    this.processingCharge = false;
                }).catch(error => {
                    if (error !== "4945")
                        this.alert("ERROR: " + error);
                    this.processingCharge = false;
                });
        }
    }

    updateValues() {
        if (this.debug) {console.log(`%cManual.updateValues()`,this.logStyle);}

        let quantity = parseInt(this.quantity),
            product  = this.productInventory[this.productID];

        this.subtotal = (product.price * quantity).toFixed(2);
        this.tax      = (product.price * this.taxValue * quantity).toFixed(2);
        this.total    = (product.price * ( this.taxValue + 1 ) * quantity).toFixed(2);
    }

    alert(message){
        if (this.debug) {console.log(`%cManual.alert(${message})`,this.logStyle);}
        // show alert
        this.alertCtrl.create({
            message: message,
            buttons: ['OK']
        }).present();
    }

    gohome(){
        if (this.debug) {console.log(`%cManual.gohome()`,this.logStyle);}
        this.isDeviceConnected(true);
    }

    /* ==========================================================================
    DEVICE MANAGEMENT
    ========================================================================== */

    setDeviceTypeAndSearch(){
        if (this.debug) {console.log(`%cManual.setDeviceTypeAndSearch()`,this.logStyle);}
        // create and present loading notification
        let loading = this.loadingCtrl.create({
            content : 'Looking for devices ...'
        });
        loading.present();
        this.ingenico.setDeviceType(DeviceType.RP750x)
            .then(result => {
                if (this.debug) {console.log(`%cManual.setDeviceTypeAndSearch()->ingenico.setDeviceType() = ${result}`,this.logStyle);}
                this.ingenico.searchForDevice()
                    .then(result => {
                        if (this.debug) {console.log(`%cManual.setDeviceTypeAndSearch()->ingenico.searchForDevice()`,this.logStyle,result);}
                        loading.dismiss();
                        this.devices = result;
                        this.showAvailableDevices();
                    })
                    .catch(error => {
                        loading.dismiss();
                        this.alert(`ERROR : ${error}`);
                    });
            })
            .catch(error => {
                this.alert(`ERROR : ${error}`);
            });
    }

    showAvailableDevices(){
        if (this.debug) {console.log(`%cManual.showAvailableDevices()`,this.logStyle);}

        let buttons = [],
            device,
            obj,
            i;

        if (this.devices.length){
            for(i = 0; i < this.devices.length; i++){
                device  = this.devices[i];
                obj     = {
                    text: this.devices[i].name,
                    handler: () => {
                      this.selectDevice(device);
                    }
                };
                buttons.push(obj);
            }

            this.actionSheetCtrl.create({
                title   : 'SELECT DEVICE',
                buttons : buttons
            }).present();
        }
        else {
            this.alert(`No devices where found`);
        }
    }

    selectDevice(device: Device){
        if (this.debug) {console.log(`%cManual.selectDevice()`,this.logStyle);}
        // create and present loading notification
        let loading = this.loadingCtrl.create({
            content: 'Configuring device ...'
        });
        loading.present();
        this.ingenico.selectDevice(device)
            .then(result => {
                if (result){
                    if (this.debug) {console.log(`%cManual.selectDevice()->ingenico.selectDevice() = ${result}`,this.logStyle);}
                    this.ingenico.setupDevice()
                        .then(result => {
                            if (this.debug) {console.log(`%cManual.selectDevice()->ingenico.setupDevice() = ${result}`,this.logStyle);}
                            loading.dismiss();
                            if (result){
                                this.deviceConnected = true;
                                this.onDeviceDisconnect();
                            }
                            else {
                                this.alert("Device could not be configured");
                            }
                        })
                        .catch(error => {
                            loading.dismiss();
                            this.alert(`ERROR : ${error}`);
                        });
                }
                else {
                    loading.dismiss();
                    this.alert("Device could not be selected.");
                }
            })
            .catch(error => {
                loading.dismiss();
                this.alert(`ERROR : ${error}`);
            });
    }

    disconnectDevice(goHome:boolean = false){
        if (this.debug) {console.log(`%cManual.disconnectDevice()`,this.logStyle);}
        this.ingenico.disconnect()
            .then(result => {
                if (this.debug) {console.log(`%cManual.disconnectDevice()->ingenico.disconnect() = ${result}`,this.logStyle);}
                if (goHome)
                    this.navCtrl.setRoot(HomePage);
            })
            .catch(error => {
                this.alert(`ERROR : ${error}`);
            });
    }

    onDeviceDisconnect(){
        if (this.debug) {console.log(`%cManual.onDeviceDisconnect()`,this.logStyle);}
        // fires off when device disconnects
        this.ingenico.onDeviceDisconnected()
            .then(result => {
                if (this.debug) {console.log(`%cManual.onDeviceDisconnect()->ingenico.onDeviceDisconnected() = ${result}`,this.logStyle);}
                this.deviceConnected = false;
            })
            .catch(error => {
                this.alert(`ERROR : ${error}`);
            });
    }

    isDeviceConnected(goHome:boolean = false){
        if (this.debug) {console.log(`%cManual.isDeviceConnected()`,this.logStyle);}
        this.ingenico.isDeviceConnected()
            .then(result=> {
                if (this.debug) {console.log(`%cManual.isDeviceConnected()->ingenico.isDeviceConnected() = ${result}`,this.logStyle);}
                if (result && goHome)
                    this.disconnectDevice(goHome);
                else if (goHome)
                    this.navCtrl.setRoot(HomePage);
            })
            .catch(error => {
                this.alert(`ERROR : ${error}`);
            });
    }
}
