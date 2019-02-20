import { Component } from '@angular/core';
import { AlertController, LoadingController } from 'ionic-angular';
import { IngenicoProvider } from '../../providers/ingenico/ingenico';
import { Amount, CreditSaleTransactionRequest, DebitSaleTransactionRequest } from '../../providers/providers';

@Component({
  selector: 'terminal-page',
  templateUrl: 'terminal.html'
})

export class TerminalPage {

    logStyle            : string    = "font-size:14px;font-family:'Operator Mono Ssm Light',Menlo,monospace";
    debug               : boolean   = true;
    username            : string    = "logicstudiotest1";
    password            : string    = "logicstudio";
    currency            : string    = "USD";
    total               : number    = 0;
    deviceConnected     : boolean   = false;
    processingCharge    : boolean   = false;

    constructor(
        public ingenico: IngenicoProvider,
        public loadingCtrl: LoadingController,
        public alertCtrl: AlertController
    ) {
        if (this.debug) {console.log(`%cterminal.constructor()`,this.logStyle);}
    }

    login(){
        if (this.debug) {console.log(`%cterminal.login()`,this.logStyle);}
        // for callback
        let debug = this.debug,
            logStyle = this.logStyle;
        // do login
        this.ingenico.login(this.username, this.password, "CAT6-64a80ac1-0ff3-4d32-ac92-5558a6870a88", "https://uatmcm.roamdata.com/", "0.1")
            .then(result => {
                if (this.debug) {console.log(`%cterminal.login()`,this.logStyle,result);}
                this.connect(function(result){
                    if (debug) {console.log(`%cterminal.login()->connect()`,logStyle,result)};
                });
            })
            .catch(error => {
                this.alert("ERROR: " + error);
            });
    }

    checkConnection(){
        this.ingenico.isDeviceConnected().then(result => {
            let alert = this.alertCtrl.create({
                title: 'IS DEVICE CONNECTED?',
                message: 'RESULT: ' + result,
                buttons: ['Dismiss']
            });
            alert.present();
        });
    }

    connect(callback){
        if (this.debug) {console.log(`%cterminal.connect()`,this.logStyle);}
        // create and present loading notification
        let loading = this.loadingCtrl.create({
            content     : "CONNECTING",
            spinner     : "dots"
        });
        loading.present();
        // do connect
        this.ingenico.connect()
            .then(result => {
                if (this.debug) {console.log(`%cterminal.connect()->connect()`,this.logStyle);}
                loading.dismiss();
                // run callback - ask why?
                callback(result);
                this.deviceConnected = true;
                // why do we run this here?
                this.checkDeviceDisconnection();
            })
            .catch(error => {
                loading.dismiss();
                callback(error);
            });
    }

    manualDisconnection(){
        this.ingenico.disconnect().then(result => {
            let alert = this.alertCtrl.create({
                title: "DISCONNECTION",
                message: "DEVICE DISCONNECTED",
                buttons: ["Dismiss"]
            });
            alert.present();
        })
    }

    checkDeviceDisconnection(){
        if (this.debug) {console.log(`%cterminal.onDisconnect()`,this.logStyle);}
        // fires off when device disconnects
        this.ingenico.onDeviceDisconnected()
            .then(result => {
                if (this.debug) {console.log(`%cterminal.onDisconnect()->onDeviceDisconnected()`,this.logStyle);}
                    this.deviceConnected = false;
            })
            .catch(error => {
                this.alert("ERROR: " + error);
            });
    }

    processCharge(type){
        if (this.debug) {console.log(`%cterminal.processCharge(${type})`,this.logStyle);}

        let amount = new Amount(this.currency, this.total*100, 0, 0, 0, "DFA-CARE-ORDER", 0);

        this.processingCharge = true;

        if (type === 'credit'){
            this.ingenico.processCreditSaleTransactionWithCardReader( new CreditSaleTransactionRequest(amount, null, null, null, null) )
                .then(result => {
                    if (this.debug) {console.log(`%cCreditCardPurchaseResponse`,this.logStyle);}
                    this.finalizeCharge(result);
                })
                .catch(error => {
                    if (error !== "4945")
                        this.alert("ERROR: " + error);
                    this.processingCharge = false;
                });
        }
        else{
            this.ingenico.processDebitSaleTransactionWithCardReader( new DebitSaleTransactionRequest(amount, null, null, null, null) )
                .then(result => {
                    if (this.debug) {console.log(`%cDebitPurchaseResponse`,this.logStyle);}
                    this.finalizeCharge(result);
                })
                .catch(error => {
                    if (error !== "4945")
                        this.alert("ERROR: " + error);
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
}