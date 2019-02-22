import { Component } from '@angular/core';
import { AlertController, LoadingController } from 'ionic-angular';
import {
    Amount,
    ConfigService,
    CreditSaleTransactionRequest,
    DebitSaleTransactionRequest,
    IngenicoProvider
} from '../../providers/providers';

@Component({
    selector    : 'terminal-page',
    templateUrl : 'terminal.html'
})

export class TerminalPage {

    logStyle         : string ;
    debug            : boolean;
    currency         : string    = "USD";
    total            : number    = 0;
    deviceConnected  : boolean   = false;
    processingCharge : boolean   = false;
    loggedIn         : boolean   = false;

    constructor(
        public alertCtrl: AlertController,
        public configService: ConfigService,
        public ingenico: IngenicoProvider,
        public loadingCtrl: LoadingController
    ){
        this.debug     = this.configService.getDebug();
        this.logStyle  = this.configService.getLogStyles().pages;
        if (this.debug) {console.log(`%cterminal.constructor()`,this.logStyle);}
    }

    login(){
        if (this.debug) {console.log(`%cterminal.login()`,this.logStyle);}
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
                    if (this.debug) {console.log(`%cterminal.login()->ingenico.login()`,this.logStyle,result);}
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

    processCharge(type){
        if (this.debug) {console.log(`%cterminal.processCharge(${type})`,this.logStyle);}

        let amount = new Amount(this.currency, this.total*100, 0, 0, 0, "DFA-CARE-ORDER", 0);

        this.processingCharge = true;

        if (type === 'credit'){
            this.ingenico.processCreditSaleTransactionWithCardReader( new CreditSaleTransactionRequest(amount, null, null, null, null) )
                .then(result => {
                    if (this.debug) {console.log(`%c\tCreditCardPurchaseResponse`,this.logStyle);}
                    this.finalizeCharge(result);
                })
                .catch(error => {
                    if (error !== "4945")
                        this.alert(`ERROR : ${error}`);
                    this.processingCharge = false;
                });
        }
        else{
            this.ingenico.processDebitSaleTransactionWithCardReader( new DebitSaleTransactionRequest(amount, null, null, null, null) )
                .then(result => {
                    if (this.debug) {console.log(`%c\tDebitPurchaseResponse`,this.logStyle);}
                    this.finalizeCharge(result);
                })
                .catch(error => {
                    if (error !== "4945")
                        this.alert(`ERROR : ${error}`);
                    this.processingCharge = false;
                });
        }
    }

    finalizeCharge(result){
        if (this.debug) {console.log(`%cterminal.finalizeCharge`,this.logStyle,result);}
        this.processingCharge = false;
        if (result.clerkDisplay === 'APPROVED'){
            this.alert("TRANSACTION COMPLETED");
            this.total = 0;
        }
        else {
            this.alert("TRANSACTION FAILED");
        }
    }

    alert(message){
        if (this.debug) {console.log(`%cterminal.alert`,this.logStyle,message);}
        // show alert
        this.alertCtrl.create({
            message: message,
            buttons: ['OK']
        }).present();
    }

    /* ==========================================================================
    DEVICE MANAGEMENT
    ========================================================================== */

    connectDevice(callback){
        if (this.debug) {console.log(`%cterminal.connect()`,this.logStyle);}
        // create and present loading notification
        let loading = this.loadingCtrl.create({
            content     : "Searching for and Connecting device",
            spinner     : "dots"
        });
        loading.present();
        // do connect
        this.ingenico.connect()
            .then(result => {
                if (this.debug) {console.log(`%cterminal.connect()->ingenico.connect() = ${result}`,this.logStyle);}
                loading.dismiss();
                this.deviceConnected = true;
                // why do we run this here?
                this.onDeviceDisconnect();
            })
            .catch(error => {
                loading.dismiss();
                callback(error);
            });
    }

    disconnectDevice(){
        this.ingenico.disconnect()
            .then(result => {
                if (this.debug) {console.log(`%cterminal.disconnect()->ingenico.disconnect() = ${result}`,this.logStyle);}
            })
            .catch(error => {
                this.alert(`ERROR : ${error}`);
            });
    }

    onDeviceDisconnect(){
        if (this.debug) {console.log(`%cterminal.onDeviceDisconnect()`,this.logStyle);}
        // fires off when device disconnects
        this.ingenico.onDeviceDisconnected()
            .then(result => {
                if (this.debug) {console.log(`%cterminal.onDeviceDisconnect()->onDeviceDisconnected()`,this.logStyle);}
                    this.deviceConnected = false;
            })
            .catch(error => {
                this.alert(`ERROR : ${error}`);
            });
    }

    isDeviceConnected(){
        if (this.debug) {console.log(`%cterminal.isDeviceConnected()`,this.logStyle);}
        this.ingenico.isDeviceConnected()
            .then(result=> {
                if (this.debug) {console.log(`%cterminal.isDeviceConnected()->ingenico.isDeviceConnected() = ${result}`,this.logStyle);}
            })
            .catch(error => {
                this.alert(`ERROR : ${error}`);
            });
    }
}