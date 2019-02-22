import { Component, ViewChild } from '@angular/core';
import { ActionSheetController, AlertController, LoadingController } from 'ionic-angular';
import { ConfigService } from '../../providers/config.service';
import {
    Amount,
    CashSaleTransactionRequest,
    CreditSaleTransactionRequest,
    DebitSaleTransactionRequest,
    Device,
    DeviceType,
    IngenicoProvider,
    Product
} from '../../../plugins/cordova-plugin-ionic-ingenico/core/providers';


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
        public ingenico: IngenicoProvider,
        public loadingCtrl: LoadingController
    ){
        this.debug     = this.configService.getDebug();
        this.logStyle  = this.configService.getLogStyles().pages;
        if (this.debug) {console.log(`%cmanual.constructor()`,this.logStyle);}
        this.updateValues();
    }

    login(){
        if (this.debug) {console.log(`%cmanual.login()`,this.logStyle);}
        if (!this.loggedIn){
            let ingenicoConfig = this.configService.getIngenicoConfig();
            // create and present loading notification
            let loading = this.loadingCtrl.create({
                content : 'Processing Login ...'
            });
            loading.present();
            this.ingenico.login(ingenicoConfig.username, ingenicoConfig.password, ingenicoConfig.apiKey, ingenicoConfig.baseUrl, ingenicoConfig.clientVersion)
                .then(result => {
                    if (this.debug) {console.log(`%cmanual.login()->ingenico.login()`,this.logStyle,result);}
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
        if (this.debug) {console.log(`%cmanual.processCharge(${type})`,this.logStyle);}
        let quantity   = parseInt(this.quantity),
            product    = this.productInventory[this.productID],
            amount     = new Amount(this.currency, this.total*100, this.subtotal*100, this.tax*100, this.discount*100, "", 0),
            products   = new Array<Product>(
                new Product(product.name,product.price, product.name, "", quantity)
            );

        this.processingCharge = true;

        if (type === 'cash') {
            this.request = new CashSaleTransactionRequest(amount, products, "", "", null);
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
            this.request = new CreditSaleTransactionRequest(amount, products, "", "", null);
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
            this.request = new DebitSaleTransactionRequest(amount, products, "", "", null);
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
        if (this.debug) {console.log(`%cmanual.updateValues()`,this.logStyle);}

        let quantity = parseInt(this.quantity),
            product  = this.productInventory[this.productID];

        this.subtotal = (product.price * quantity).toFixed(2);
        this.tax      = (product.price * this.taxValue * quantity).toFixed(2);
        this.total    = (product.price * ( this.taxValue + 1 ) * quantity).toFixed(2);
    }

    alert(message){
        if (this.debug) {console.log(`%cmanual.alert`,this.logStyle,message);}
        // show alert
        this.alertCtrl.create({
            message: message,
            buttons: ['OK']
        }).present();
    }

    /* ==========================================================================
    DEVICE MANAGEMENT
    ========================================================================== */

    setDeviceTypeAndSearch(){
        if (this.debug) {console.log(`%cmanual.setDeviceTypeAndSearch()`,this.logStyle);}
        // create and present loading notification
        let loading = this.loadingCtrl.create({
            content : 'Looking for devices ...'
        });
        loading.present();
        this.ingenico.setDeviceType(DeviceType.RP750x)
            .then(result => {
                if (this.debug) {console.log(`%cmanual.setDeviceTypeAndSearch()->ingenico.setDeviceType() = ${result}`,this.logStyle);}
                this.ingenico.searchForDevice()
                    .then(result => {
                        if (this.debug) {console.log(`%cmanual.setDeviceTypeAndSearch()->ingenico.searchForDevice()`,this.logStyle,result);}
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
        if (this.debug) {console.log(`%cmanual.showAvailableDevices()`,this.logStyle);}

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
        if (this.debug) {console.log(`%cmanual.selectDevice()`,this.logStyle);}
        // create and present loading notification
        let loading = this.loadingCtrl.create({
            content: 'Configuring device ...'
        });
        loading.present();
        this.ingenico.selectDevice(device)
            .then(result => {
                if (result){
                    if (this.debug) {console.log(`%cmanual.selectDevice()->ingenico.selectDevice() = ${result}`,this.logStyle);}
                    this.ingenico.setupDevice()
                        .then(result => {
                            if (this.debug) {console.log(`%cmanual.selectDevice()->ingenico.setupDevice() = ${result}`,this.logStyle);}
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

    disconnectDevice(){
        if (this.debug) {console.log(`%cmanual.disconnectDevice()`,this.logStyle);}
        this.ingenico.disconnect()
            .then(result => {
                if (this.debug) {console.log(`%cmanual.disconnectDevice()->ingenico.disconnect() = ${result}`,this.logStyle);}
            })
            .catch(error => {
                this.alert(`ERROR : ${error}`);
            });
    }

    onDeviceDisconnect(){
        if (this.debug) {console.log(`%cmanual.onDeviceDisconnect()`,this.logStyle);}
        // fires off when device disconnects
        this.ingenico.onDeviceDisconnected()
            .then(result => {
                if (this.debug) {console.log(`%cmanual.onDeviceDisconnect()->ingenico.onDeviceDisconnected() = ${result}`,this.logStyle);}
                this.deviceConnected = false;
            })
            .catch(error => {
                this.alert(`ERROR : ${error}`);
            });
    }

    isDeviceConnected(){
        if (this.debug) {console.log(`%cmanual.isDeviceConnected()`,this.logStyle);}
        this.ingenico.isDeviceConnected()
            .then(result=> {
                if (this.debug) {console.log(`%cmanual.isDeviceConnected()->ingenico.isDeviceConnected() = ${result}`,this.logStyle);}
            })
            .catch(error => {
                this.alert(`ERROR : ${error}`);
            });
    }
}
