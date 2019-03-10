import { Component } from '@angular/core';
import { AlertController, LoadingController, NavController } from 'ionic-angular';
import { ConfigService } from '../../providers/config.service';
import { Ingenico } from '../../providers/ingenico';
import {
    Amount,
    CreditSaleTransactionRequest,
    DebitSaleTransactionRequest
} from '../../providers/ingenico/models';
import { HomePage } from '../pages';

@Component({
    selector    : 'Terminal-page',
    templateUrl : 'Terminal.html'
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
        public ingenico: Ingenico,
        public loadingCtrl: LoadingController,
        public navCtrl: NavController
    ){
        this.debug     = this.configService.getDebug();
        this.logStyle  = this.configService.getLogStyles().pages;
        if (this.debug) {console.log(`%cTerminal.constructor()`,this.logStyle);}
    }

    login(){
        if (this.debug) {console.log(`%cTerminal.login()`,this.logStyle);}
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
                    if (this.debug) {console.log(`%cTerminal.login()->ingenico.login()`,this.logStyle,result);}
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
        if (this.debug) {console.log(`%cTerminal.processCharge(${type})`,this.logStyle);}

        let amount = new Amount(this.currency, this.total*100, 0, 0, 0, "", 0),
            notes  = `This is a transaction note from Terminal.processCharge(${type})`;

        this.processingCharge = true;

        if (type === 'credit'){
            this.ingenico.processCreditSaleTransactionWithCardReader( new CreditSaleTransactionRequest(amount, null, notes) )
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
            this.ingenico.processDebitSaleTransactionWithCardReader( new DebitSaleTransactionRequest(amount, null, notes) )
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
        if (this.debug) {console.log(`%cTerminal.finalizeCharge`,this.logStyle,result);}
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
        if (this.debug) {console.log(`%cTerminal.alert(${message})`,this.logStyle);}
        // show alert
        this.alertCtrl.create({
            message: message,
            buttons: ['OK']
        }).present();
    }

    gohome(){
        if (this.debug) {console.log(`%cTerminal.gohome()`,this.logStyle);}
        this.isDeviceConnected(true);
    }

    /* ==========================================================================
    DEVICE MANAGEMENT
    ========================================================================== */

    connectDevice(){
        if (this.debug) {console.log(`%cTerminal.connectDevice()`,this.logStyle);}
        // create and present loading notification
        let loading = this.loadingCtrl.create({
            content     : "Searching for and Connecting device",
            spinner     : "dots"
        });
        loading.present();

        // do connect
        this.ingenico.connect()
            .then(result => {
                if (this.debug) {console.log(`%cTerminal.connectDevice()->ingenico.connect() = ${result}`,this.logStyle);}
                loading.dismiss();
                this.deviceConnected = true;
            })
            .catch(error => {
                loading.dismiss();
            });
    }

    disconnectDevice(goHome:boolean = false){
        if (this.debug) {console.log(`%cTerminal.disconnectDevice()`,this.logStyle);}
        this.ingenico.disconnect()
            .then(result => {
                if (this.debug) {console.log(`%cTerminal.disconnectDevice()->ingenico.disconnect() = ${result}`,this.logStyle);}
                if (goHome)
                    this.navCtrl.setRoot(HomePage);
            })
            .catch(error => {
                this.alert(`ERROR : ${error}`);
            });
    }

    isDeviceConnected(goHome:boolean = false){
        if (this.debug) {console.log(`%cTerminal.isDeviceConnected()`,this.logStyle);}
        this.ingenico.isDeviceConnected()
            .then(result=> {
                if (this.debug) {console.log(`%cTerminal.isDeviceConnected()->ingenico.isDeviceConnected() = ${result}`,this.logStyle);}
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
