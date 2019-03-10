import { Component, ViewChild } from '@angular/core';
import { AlertController, LoadingController, NavController, ToastController } from 'ionic-angular';
import { ConfigService } from '../../providers/config.service';
import { Ingenico } from '../../providers/ingenico';
import {
    Amount,
    CreditSaleTransactionRequest,
    DebitSaleTransactionRequest
} from '../../providers/ingenico/models';
import { HomePage } from '../pages';

@Component({
    selector    : 'automatic-page',
    templateUrl : 'automatic.html'
})

export class AutomaticPage {

    @ViewChild('orderForm') form;

    logStyle         : string ;
    debug            : boolean;
    request          : any;
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
    deviceSearch     : boolean   = false;
    processingCharge : boolean   = false;
    loggedIn         : boolean   = false;
    productInventory : Array<any> = [
        {id:0,name:"PRODUCT #1",price:1.00},
        {id:1,name:"PRODUCT #2",price:1.50},
        {id:2,name:"PRODUCT #3",price:2.00}
    ];

    constructor(
        public alertCtrl: AlertController,
        public configService: ConfigService,
        public ingenico: Ingenico,
        public loadingCtrl: LoadingController,
        public navCtrl: NavController,
        public toastCtrl: ToastController
    ){
        this.debug     = this.configService.getDebug();
        this.logStyle  = this.configService.getLogStyles().pages;
        if (this.debug) {console.log(`%cAutomatic.constructor()`,this.logStyle);}
        this.updateValues();
    }

    login(){
        if (this.debug) {console.log(`%cAutomatic.login()`,this.logStyle);}
        // do login
        if (!this.loggedIn){
            let ingenicoConfig = this.configService.getIngenicoConfig();
            // create and present loading notification
            let loading = this.loadingCtrl.create({
                content : 'Processing Login ...'
            });
            loading.present();
            this.ingenico.login(ingenicoConfig.username, ingenicoConfig.password, ingenicoConfig.apiKey, ingenicoConfig.baseUrl, ingenicoConfig.clientVersion)
                .then(result => {
                    if (this.debug) {console.log(`%cAutomatic.login()->ingenico.login()`,this.logStyle,result);}
                    loading.dismiss();
                    this.loggedIn = true;
                    this.connectDevice();
                }).catch(error => {
                    loading.dismiss();
                    this.alert(`ERROR : ${error}`);
                });
        }
        else {
            this.connectDevice();
        }
    }

    processCharge(type) {
        if (this.debug) {console.log(`%cAutomatic.processCharge(${type})`,this.logStyle);}
        let amount = new Amount(this.currency, this.total*100, this.subtotal*100, this.tax*100, this.discount*100, "", 0),
            notes  = `This is a transaction note from Automatic.processCharge(${type})`;

        this.processingCharge = true;

        if (type === 'credit') {
            this.request = new CreditSaleTransactionRequest(amount, null, notes);
            this.ingenico.processCreditSaleTransactionWithCardReader(this.request)
                .then(result => {
                    if (this.debug) {console.log(`%c\tCreditCardPurchaseResponse`,this.logStyle,result);}
                    this.alert(result.transactionResponseCode === 1 ? 'Credit Purchase Complete' : 'Credit Purchase Failed');
                    this.processingCharge = false;
                }).catch(error => {
                    if (error !== "4945")
                        this.alert(`ERROR : ${error}`);
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
                        this.alert(`ERROR : ${error}`);
                    this.processingCharge = false;
                });
        }
    }

    updateValues() {
        if (this.debug) {console.log(`%cAutomatic.updateValues()`,this.logStyle);}

        let quantity = parseInt(this.quantity),
            product  = this.productInventory[this.productID];

        this.subtotal = (product.price * quantity).toFixed(2);
        this.tax      = (product.price * this.taxValue * quantity).toFixed(2);
        this.total    = (product.price * ( this.taxValue + 1 ) * quantity).toFixed(2);
    }

    alert(message){
        if (this.debug) {console.log(`%cAutomatic.alert(${message})`,this.logStyle);}
        // show alert
        this.alertCtrl.create({
            message: message,
            buttons: ['OK']
        }).present();
    }

    gohome(){
        if (this.debug) {console.log(`%cAutomatic.gohome()`,this.logStyle);}
        this.isDeviceConnected(true);
    }

    /* ==========================================================================
    DEVICE MANAGEMENT
    ========================================================================== */

    connectDevice(){
        if (this.debug) {console.log(`%cAutomatic.connectDevice()`,this.logStyle);}
        // create and present loading notification
        let loading = this.alertCtrl.create({
            title   : 'Device Search',
            message : 'Searching for device to connect to',
            buttons: [
              {
                text: 'CANCEL SEARCH',
                role: 'cancel',
                handler: () => {
                    this.ingenico.stopSearchForDevice()
                        .then(result => {
                            if (this.debug) {console.log(`%cAutomatic.connectDevice()->ingenico.stopSearchForDevice() = ${result}`,this.logStyle);}
                            // set device search off
                            this.deviceSearch = false;
                        })
                        .catch(error => {
                            this.alert(`ERROR : ingenico.stopSearchForDevice() -> ${error}`);
                        });
                }
              }
            ]
        });
        loading.present();
        // set search on
        this.deviceSearch = true;
        // do connect
        this.ingenico.connect()
            .then(result => {
                if (this.debug) {console.log(`%cAutomatic.connectDevice()->ingenico.connect() = ${result}`,this.logStyle);}
                this.deviceSearch    = false;
                loading.dismiss();
                if (result) {
                    this.deviceConnected = true;
                } else {
                    this.toastCtrl.create({
                        message: 'No devices where discovered',
                        duration: 3000,
                        position: 'middle',
                        cssClass: 'danger',
                        showCloseButton : true
                      }).present();
                }
            })
            .catch(error => {
                console.log(this.deviceConnected,this.deviceSearch);
                if (this.deviceSearch){
                    loading.dismiss();
                    this.alert(`ERROR : this.ingenico.connect() -> ${error}`);
                    this.deviceSearch = false;
                }
            });
    }

    disconnectDevice(goHome:boolean = false){
        if (this.debug) {console.log(`%cAutomatic.disconnectDevice(${goHome})`,this.logStyle);}
        this.ingenico.disconnect()
            .then(result => {
                if (this.debug) {console.log(`%cAutomatic.disconnectDevice()->ingenico.disconnect() = ${result}`,this.logStyle);}
                if (goHome)
                    this.navCtrl.setRoot(HomePage);
            })
            .catch(error => {
                this.alert(`ERROR : ${error}`);
            });
    }

    isDeviceConnected(goHome:boolean = false){
        if (this.debug) {console.log(`%cAutomatic.isDeviceConnected(${goHome})`,this.logStyle);}
        this.ingenico.isDeviceConnected()
            .then(result=> {
                if (this.debug) {console.log(`%cAutomatic.isDeviceConnected()->ingenico.isDeviceConnected() = ${result}`,this.logStyle);}
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
