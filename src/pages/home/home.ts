import { Component, ViewChild } from '@angular/core';
import { AlertController, LoadingController } from 'ionic-angular';
import { ConfigService } from '../../providers/config.service';
import {
    Amount,
    CreditSaleTransactionRequest,
    DebitSaleTransactionRequest,
    IngenicoProvider,
    Product
} from '../../../plugins/cordova-plugin-ionic-ingenico/core/providers';

@Component({
    selector    : 'home-page',
    templateUrl : 'home.html'
})

export class HomePage {

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
        public ingenico: IngenicoProvider,
        public loadingCtrl: LoadingController
    ){
        this.debug     = this.configService.getDebug();
        this.logStyle  = this.configService.getLogStyles().pages;
        if (this.debug) {console.log(`%chome.constructor()`,this.logStyle);}
        this.updateValues();
    }

    login(){
        if (this.debug) {console.log(`%chome.login()`,this.logStyle);}
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
                    if (this.debug) {console.log(`%chome.login()->ingenico.login()`,this.logStyle,result);}
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
        if (this.debug) {console.log(`%chome.processCharge(${type})`,this.logStyle);}
        let quantity   = parseInt(this.quantity),
            product    = this.productInventory[this.productID],
            amount     = new Amount(this.currency, this.total*100, this.subtotal*100, this.tax*100, this.discount*100, "", 0),
            products   = new Array<Product>(
                new Product(product.name,product.price, product.name, "", quantity)
            );

        this.processingCharge = true;

        if (type === 'credit') {
            this.request = new CreditSaleTransactionRequest(amount, products, "", "", null);
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
            this.request = new DebitSaleTransactionRequest(amount, products, "", "", null);
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

    uploadSignature() {
        if (this.debug) {console.log(`%chome.uploadSignature()`,this.logStyle);}
        this.ingenico.getReferenceForTransactionWithPendingSignature()
            .then(result => {
                if (result){
                    this.ingenico.uploadSignature(result, "SG9sYSBtdW5kbw==")
                        .then(result => {
                            this.alert(result);
                        }).catch(error => {
                            this.alert(error);
                        });
                }
                else {
                    this.alert("No transaction with pending signature.");
                }
            })
            .catch(error => {
                this.alert("No transaction with pending signature.");
            });
    }

    updateValues() {
        if (this.debug) {console.log(`%chome.updateValues()`,this.logStyle);}

        let quantity = parseInt(this.quantity),
            product  = this.productInventory[this.productID];

        this.subtotal = (product.price * quantity).toFixed(2);
        this.tax      = (product.price * this.taxValue * quantity).toFixed(2);
        this.total    = (product.price * ( this.taxValue + 1 ) * quantity).toFixed(2);
    }

    alert(message){
        if (this.debug) {console.log(`%chome.alert`,this.logStyle,message);}
        // show alert
        this.alertCtrl.create({
            message: message,
            buttons: ['OK']
        }).present();
    }

    /* ==========================================================================
    DEVICE MANAGEMENT
    ========================================================================== */

    connectDevice(){
        if (this.debug) {console.log(`%chome.connectDevice()`,this.logStyle);}
        // create and present loading notification
        let loading = this.loadingCtrl.create({
            content : 'Searching for and Connecting device...'
        });
        loading.present();
        // do connect
        this.ingenico.connect()
            .then(result => {
                if (this.debug) {console.log(`%chome.connectDevice()->ingenico.connect() = ${result}`,this.logStyle);}
                loading.dismiss();
                this.deviceConnected = true;
                // why do we run this here?
                this.onDeviceDisconnect();
            })
            .catch(error => {
                loading.dismiss();
                this.alert(`ERROR : ${error}`);
            });
    }

    disconnectDevice(){
        if (this.debug) {console.log(`%chome.disconnectDevice()`,this.logStyle);}
        this.ingenico.disconnect()
            .then(result => {
                if (this.debug) {console.log(`%chome.disconnectDevice()->ingenico.disconnect() = ${result}`,this.logStyle);}
            })
            .catch(error => {
                this.alert(`ERROR : ${error}`);
            });
    }

    onDeviceDisconnect(){
        if (this.debug) {console.log(`%chome.onDeviceDisconnect()`,this.logStyle);}
        // fires off when device disconnects
        this.ingenico.onDeviceDisconnected()
            .then(result => {
                if (this.debug) {console.log(`%chome.onDeviceDisconnect()->ingenico.onDeviceDisconnected() = ${result}`,this.logStyle);}
                this.deviceConnected = false;
            })
            .catch(error => {
                console.log(`ERROR : ${error}`);
            });
    }

    isDeviceConnected(){
        if (this.debug) {console.log(`%chome.isDeviceConnected()`,this.logStyle);}
        this.ingenico.isDeviceConnected()
            .then(result=> {
                if (this.debug) {console.log(`%chome.isDeviceConnected()->ingenico.isDeviceConnected() = ${result}`,this.logStyle);}
            })
            .catch(error => {
                this.alert(`ERROR : ${error}`);
            });
    }
}
