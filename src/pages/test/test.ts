import { Component } from '@angular/core';
import { ActionSheetController, AlertController, NavController } from 'ionic-angular';
import { ConfigService, LoadingAndErrorHandling } from '../../providers/services';
import { Ingenico } from '../../providers/ingenico';
import {
    Amount,
    CashSaleTransactionRequest,
    CreditSaleTransactionRequest,
    DebitSaleTransactionRequest,
    Device,
    DeviceType,
    ResponseCode,
    UserProfile
} from '../../providers/ingenico/models';
import { HomePage } from '../pages';
import * as moment from 'moment';

@Component({
    selector    : 'test-page',
    templateUrl : 'test.html'
})

export class TestPage {

    logStyle         : string ;
    debug            : boolean;
    connectionInfo   : string;

    devices          : Device[];

    // for undefined properties ( used in listener creation in ionViewWillEnter )
    [x: string]: any;

    constructor(
        public alertCtrl: AlertController,
        public actionSheetCtrl: ActionSheetController,
        public configService: ConfigService,
        public ingenico: Ingenico,
        public loadingAndErrorHandling: LoadingAndErrorHandling,
        public navCtrl: NavController
    ){
        this.debug     = this.configService.getDebug();
        this.logStyle  = this.configService.getLogStyles().pages;
        if (this.debug) {console.log(`%cTest.constructor()`,this.logStyle);}
    }

    ionViewWillEnter(){
        if (this.debug) {console.log(`%cTest.ionViewWillEnter() : add event listeners`,this.logStyle);}
        // add custom event listeners
        if (!this.onDeviceSelectedBound)
            this.onDeviceSelectedBound = this.onDeviceSelected.bind(this);
        if (!this.onDeviceConnectedBound)
            this.onDeviceConnectedBound = this.onDeviceConnected.bind(this);
        if (!this.onDeviceReadyBound)
            this.onDeviceReadyBound = this.onDeviceReady.bind(this);
        if (!this.onDeviceDisconnectedBound)
            this.onDeviceDisconnectedBound = this.onDeviceDisconnected.bind(this);
        if (!this.onDeviceErrorBound)
            this.onDeviceErrorBound = this.onDeviceError.bind(this);
        document.addEventListener('Ingenico:device:selected',this.onDeviceSelectedBound,false);
        document.addEventListener('Ingenico:device:connected',this.onDeviceConnectedBound,false);
        document.addEventListener('Ingenico:device:ready',this.onDeviceReadyBound,false);
        document.addEventListener('Ingenico:device:disconnected',this.onDeviceDisconnectedBound,false);
        document.addEventListener('Ingenico:device:error',this.onDeviceErrorBound,false);
        this.isLoggedIn();
    }

    ionViewWillLeave(){
        if (this.debug) {console.log(`%cTest.ionViewWillLeave() : remove event listeners`,this.logStyle);}
        // remove custom event listeners
        document.removeEventListener('Ingenico:device:selected',this.onDeviceSelectedBound,false);
        document.removeEventListener('Ingenico:device:connected',this.onDeviceConnectedBound,false);
        document.removeEventListener('Ingenico:device:ready',this.onDeviceReadyBound,false);
        document.removeEventListener('Ingenico:device:disconnected',this.onDeviceDisconnectedBound,false);
        document.removeEventListener('Ingenico:device:error',this.onDeviceErrorBound,false);
    }

    // Device Connection Listeners

    onDeviceSelected(event:any){
        if (this.debug) {console.log(`%cTest.onDeviceSelected()`,this.logStyle,event); }
        this.loadingAndErrorHandling.showLoading('DEVICE SELECTED','hide',true);
    }

    onDeviceConnected(){
        if (this.debug) {console.log(`%cTest.onDeviceConnected()`,this.logStyle); }
        this.loadingAndErrorHandling.showLoading('CONFIGURING DEVICE','hide',true);
    }

    onDeviceReady(){
        if (this.debug) {console.log(`%cTest.onDeviceReady()`,this.logStyle); }
        this.loadingAndErrorHandling.showLoading('DEVICE READY FOR USE','hide',true,true);
        setTimeout(() => {
            this.loadingAndErrorHandling.hideLoading();
        }, 1000);
    }

    onDeviceDisconnected(){
        if (this.debug) {console.log(`%cTest.onDeviceDisconnected()`,this.logStyle); }
        this.loadingAndErrorHandling.showAlert('DEVICE DISCONNECTED');
        this.isLoggedIn();
    }

    onDeviceError(event){
        if (this.debug) {console.log(`%cTest.onDeviceError()`,this.logStyle,event.detail); }
        this.loadingAndErrorHandling.showAlert(`DEVICE CONNECTION ERROR<br />${event.detail}`);
    }

    getErrorForResponseCode(error){
        let errorCode = parseInt(error);
        if ( !isNaN(errorCode) ){
            for (let code in ResponseCode){
                if (ResponseCode[code] === errorCode){
                    error = code;
                    break;
                }
            }
            if (errorCode === error)
                error = 'Unknown Error';
        }
        return error;
    }

    // Authentication

    login(){
        if (this.debug) {console.log(`%cTest.login()`,this.logStyle);}
        let ingenicoConfig = this.configService.getIngenicoConfig();

        this.loadingAndErrorHandling.showLoading('Processing ...');

        this.ingenico.login(ingenicoConfig.username, ingenicoConfig.password, ingenicoConfig.apiKey, ingenicoConfig.baseUrl, ingenicoConfig.clientVersion)
            .then(result => {
                let userProfile:UserProfile = result;
                if (this.debug) {
                    let sessionExpires = moment(userProfile.session.expiresTime,'YYYYMMDDHHmmss').add(moment().utcOffset(),'m').format('MM/DD/YYYY hh:mm a');
                    console.log(`%cTest.login() : this.ingenico.login() : expires on ${sessionExpires}`,this.logStyle,userProfile);
                    this.updateConnectionInfo(`AUTHENTICATED : SESSION EXPIRES : ${sessionExpires}`);
                }
                this.loadingAndErrorHandling.hideLoading();
            })
            .catch(error => {
                if (this.debug) {console.error(`%cTest.login() : this.ingenico.login : Error : ${error}`,this.logStyle);}
                this.updateConnectionInfo();
                this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','LOGIN ERROR');
            });
    }

    logoff(){
        if (this.debug) {console.log(`%cTest.logoff()`,this.logStyle);}
        this.ingenico.logoff()
            .then(result => {
                if (this.debug) {console.log(`%cTest.logoff() : this.ingenico.logoff() : ${result}`,this.logStyle);}
                this.updateConnectionInfo();
            })
            .catch(error => {
                if (this.debug) {console.error(`%cTest.logoff() : this.ingenico.logoff : Error : ${error}`,this.logStyle);}
                this.updateConnectionInfo();
                this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','LOG OFF ERROR');
            });
    }

    refreshUserSession(){
        if (this.debug) {console.log(`%cTest.refreshUserSession()`,this.logStyle);}
        this.ingenico.refreshUserSession()
            .then(result => {
                if (this.debug) {console.log(`%cTest.refreshUserSession() : this.ingenico.refreshUserSession()`,this.logStyle,result);}
                if(typeof result === "object" && result.session){
                    let userProfile:UserProfile = result;
                    let sessionExpires = moment(userProfile.session.expiresTime,'YYYYMMDDHHmmss').add(moment().utcOffset(),'m').format('MM/DD/YYYY hh:mm a');
                    if (this.debug) { console.log(`%c\tSession expires on ${sessionExpires}`,this.logStyle); }
                    this.updateConnectionInfo(`AUTHENTICATED : SESSION EXPIRES : ${sessionExpires}`);
                }
            })
            .catch(error => {
                if (this.debug) {console.error(`%cTest.refreshUserSession() : this.ingenico.refreshUserSession : Error : ${error}`,this.logStyle);}
                this.updateConnectionInfo();
                this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','REFRESH SESSION ERROR');
            });
    }

    isLoggedIn(){
        if (this.debug) {console.log(`%cTest.isLoggedIn()`,this.logStyle);}
        this.ingenico.isLoggedIn()
            .then(result => {
                if (this.debug) { console.log(`%cTest.isLoggedIn() : this.ingenico.isLoggedIn(${result})`,this.logStyle); }
                if (result)
                    this.refreshUserSession();
                else
                    this.updateConnectionInfo();
            })
            .catch(error => {
                if (this.debug) {console.error(`%cTest.refreshUserSession() : this.ingenico.refreshUserSession : Error : ${error}`,this.logStyle);}
                this.updateConnectionInfo();
                this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','IS LOGGED IN ERROR');
            });
    }

    updateConnectionInfo(value:string = ''){
        this.connectionInfo = (value === '') ? 'LOGIN REQUIRED' : value;
    }

    // Device Information

    getBatteryLevel(){
        if (this.debug) {console.log(`%cTest.getBatteryLevel()`,this.logStyle);}
        this.ingenico.getBatteryLevel()
            .then(result => {
                if (this.debug) {console.log(`%cTest.getBatteryLevel() : this.ingenico.getBatteryLevel()`,this.logStyle,result);}
                this.loadingAndErrorHandling.showAlert(`${result}%`,'','BATTERY LEVEL');
            })
            .catch(error => {
                if (this.debug) {console.error(`%cTest.getBatteryLevel() : this.ingenico.getBatteryLevel : Error : ${error}`,this.logStyle);}
                this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','BATTERY LEVEL ERROR');
            });
    }

    getDeviceType(){
        if (this.debug) {console.log(`%cTest.getDeviceType()`,this.logStyle);}
        this.ingenico.getDeviceType()
            .then(result => {
                if (this.debug) {console.log(`%cTest.getDeviceType() : this.ingenico.getDeviceType()`,this.logStyle,result);}
                let pos = 0;
                let device = '';
                for (let type in DeviceType){
                    if(result === pos){
                        device = DeviceType[type];
                        break;
                    }
                    pos++;
                }
                this.loadingAndErrorHandling.showAlert(device,'','DEVICE TYPE');
            })
            .catch(error => {
                if (this.debug) {console.error(`%cTest.getDeviceType() : this.ingenico.getDeviceType : Error : ${error}`,this.logStyle);}
                this.loadingAndErrorHandling.showError(error,'','DEVICE TYPE ERROR');
            });
    }

    // Device Connection

    connect(){
        if (this.debug) {console.log(`%cTest.connect()`,this.logStyle);}

        let loading = this.alertCtrl.create({
            message : 'LOOKING FOR DEVICE',
            buttons: [
              {
                text: 'CANCEL',
                role: 'cancel',
                handler: () => {
                    this.stopSearchForDevice();
                }
              }
            ]
        });
        loading.present();

        this.ingenico.connect()
            .then(result => {
                if (this.debug) {console.log(`%cTest.connect() : this.ingenico.connect()`,this.logStyle,result);}
                loading.dismiss();
                if (typeof result === 'boolean' && !result)
                    this.loadingAndErrorHandling.showAlert('NO DEVICES FOUND');
            })
            .catch(error => {
                if (this.debug) {console.error(`%cTest.connect() : this.ingenico.connect : Error : ${error}`,this.logStyle);}
                loading.dismiss();
                this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','AUTO CONNECT ERROR');
            });
    }

    disconnect(){
        if (this.debug) {console.log(`%cTest.disconnect()`,this.logStyle);}
        this.ingenico.disconnect()
            .then(result => {
                if (this.debug) {console.log(`%cTest.disconnect() : this.ingenico.disconnect() : ${result}`,this.logStyle);}
            })
            .catch(error => {
                if (this.debug) {console.error(`%cTest.disconnect() : this.ingenico.disconnect : Error : ${error}`,this.logStyle);}
                this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','DISCONNECT ERROR');
            });
    }

    isDeviceConnected(){
        if (this.debug) {console.log(`%cTest.isDeviceConnected()`,this.logStyle);}
        this.ingenico.isDeviceConnected()
            .then(result => {
                if (this.debug) {console.log(`%cTest.isDeviceConnected() : this.ingenico.isDeviceConnected()`,this.logStyle,result);}
                this.loadingAndErrorHandling.showAlert(result ? 'YES' : 'NO','','DEVICE CONNECTED');
            })
            .catch(error => {
                if (this.debug) {console.error(`%cTest.isDeviceConnected() : this.ingenico.isDeviceConnected : Error : ${error}`,this.logStyle);}
                this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','IS DEVICE CONNECTED ERROR');
            });
    }

    // Device Setup

    // Invoked by Device selection from showAvailableDevices
    selectDevice(device: Device){
        if (this.debug) {console.log(`%cTest.selectDevice()`,this.logStyle);}
        this.ingenico.selectDevice(device)
        .then(result => {
            if (result){
                if (this.debug) {console.log(`%cTest.selectDevice():ingenico.selectDevice() = ${result}`,this.logStyle);}
                this.onDeviceSelected(null);
            }
            else
                this.loadingAndErrorHandling.showAlert('Device could not be selected.');
        })
        .catch(error => {
            this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','SELECT DEVICE ERROR');
        });
    }

    setDeviceType(){
        if (this.debug) {console.log(`%cTest.setDeviceType()`,this.logStyle);}
        this.ingenico.setDeviceType(DeviceType.RP750x)
            .then(result => {
                if (this.debug) {console.log(`%cTest.setDeviceType():ingenico.setDeviceType() = ${result}`,this.logStyle);}
                this.loadingAndErrorHandling.showAlert(result ? 'YES' : 'NO','','DEVICE TYPE SET');
            })
            .catch(error => {
                this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','SET DEVICE TYPE ERROR');
            });
    }

    setBadDeviceType(){
        if (this.debug) {console.log(`%cTest.setBadDeviceType()`,this.logStyle);}
        this.ingenico.setDeviceType(DeviceType.RP45BT)
            .then(result => {
                if (this.debug) {console.log(`%cTest.setBadDeviceType():ingenico.setDeviceType() = ${result}`,this.logStyle);}
                this.loadingAndErrorHandling.showAlert(result ? 'YES' : 'NO','','DEVICE TYPE SET');
            })
            .catch(error => {
                this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','SET BAD DEVICE TYPE ERROR');
            });
    }

    // Device Search

    searchForDevice(){
        if (this.debug) {console.log(`%cTest.searchForDevice()`,this.logStyle);}

        let loading = this.alertCtrl.create({
            message : 'LOOKING FOR DEVICES',
            buttons: [
              {
                text: 'CANCEL',
                role: 'cancel',
                handler: () => {
                    this.stopSearchForDevice();
                }
              }
            ]
        });
        loading.present();

        this.ingenico.searchForDevice()
            .then(result => {
                if (this.debug) {console.log(`%cTest.searchForDevice() : this.ingenico.searchForDevice()`,this.logStyle,result);}
                loading.dismiss();
                this.devices = result;
                this.showAvailableDevices();
            })
            .catch(error => {
                if (this.debug) {console.error(`%cTest.searchForDevice() : this.ingenico.searchForDevice : Error : ${error}`,this.logStyle);}
                loading.dismiss();
                this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','DEVICE SEARCH ERROR');
            });
    }

    stopSearchForDevice(){
        if (this.debug) {console.log(`%cTest.stopSearchForDevice()`,this.logStyle);}
        this.ingenico.stopSearchForDevice()
            .then(result => {
                if (this.debug) {console.log(`%cTest.stopSearchForDevice() : this.ingenico.stopSearchForDevice() : ${result}`,this.logStyle);}
                this.loadingAndErrorHandling.showToast('STOPPED DEVICE SEARCH');
            })
            .catch(error => {
                if (this.debug) {console.error(`%cTest.stopSearchForDevice() : this.ingenico.stopSearchForDevice : Error : ${error}`,this.logStyle);}
                this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','STOP DEVICE SEARCH ERROR');
            });
    }

    // Transactions
    cash(){
        if (this.debug) {console.log(`%cTest.cash()`,this.logStyle);}
        this.transactionPrompt('cash');
    }

    credit(){
        if (this.debug) {console.log(`%cTest.credit()`,this.logStyle);}
        this.transactionPrompt('credit');

    }

    debit(){
        if (this.debug) {console.log(`%cTest.debit()`,this.logStyle);}
        this.transactionPrompt('debit');
    }

    // UI UPDATES

    showAvailableDevices(){
        if (this.debug) {console.log(`%cTest.showAvailableDevices()`,this.logStyle);}

        let buttons = [],
            device,
            obj;

        if (this.devices.length){
            for(let i = 0; i < this.devices.length; i++){
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
            this.loadingAndErrorHandling.showAlert(`NO DEVICES WHERE FOUND`);
        }
    }

    transactionPrompt(transactionType:string){
        if (this.debug) {console.log(`%cTest.transactionPrompt(${transactionType})`,this.logStyle);}
        let alert = this.alertCtrl.create({
            title: `${transactionType} Transaction`.toUpperCase(),
            inputs: [
                {
                    name: 'amount',
                    placeholder: 'Enter Amount',
                    type:'tel'
                }
            ],
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel'
                },
                {
                    text: `Charge`,
                    handler: data => {
                        let amount = parseInt(data.amount);
                        if(!isNaN(amount) && amount > 0){
                            this.doTransaction(transactionType,amount);
                        }
                    }
                }
            ]
          });
          alert.present();
    }

    doTransaction(transactionType:string,_amount:number){
        if (this.debug) {console.log(`%cTest.doTransaction(${transactionType},${_amount})`,this.logStyle);}
        let amount  = new Amount('USD', _amount*100, _amount*100, 0, 0, "", 0),
            notes   = `This is a transaction note from Test.doTransaction(${transactionType})`,
            groupID = "",
            request;

        if (transactionType === 'cash') {
            request = new CashSaleTransactionRequest(amount, groupID, notes);
            this.ingenico.processCashTransaction(request)
                .then(result => {
                    if (this.debug) {console.log(`%c\tCashPurchaseResponse`,this.logStyle,result);}
                    this.loadingAndErrorHandling.showAlert(result.transactionResponseCode === 1 ? 'Cash Purchase Complete' : 'Cash Purchase Failed');
                })
                .catch(error => {
                    if (error !== ResponseCode.TransactionCancelled)
                        this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','CASH TRANSACTION ERROR');
                });
        }
        else if (transactionType === 'credit') {
            request = new CreditSaleTransactionRequest(amount, null, notes);
            this.ingenico.processCreditSaleTransactionWithCardReader(request)
                .then(result => {
                    if (this.debug) {console.log(`%c\tCreditCardPurchaseResponse`,this.logStyle,result);}
                    this.loadingAndErrorHandling.showAlert(result.transactionResponseCode === 1 ? 'Credit Purchase Complete' : 'Credit Purchase Failed');
                })
                .catch(error => {
                    if (error !== ResponseCode.TransactionCancelled)
                        this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','CREDIT TRANSACTION ERROR');
                });
        }
        else {
            request = new DebitSaleTransactionRequest(amount, null, notes);
            this.ingenico.processDebitSaleTransactionWithCardReader(request)
                .then(result => {
                    if (this.debug) {console.log(`%c\tDebitPurchaseResponse`,this.logStyle,result);}
                    this.loadingAndErrorHandling.showAlert(result.transactionResponseCode === 1 ? 'Debit Purchase Complete' : 'Debit Purchase Failed');
                })
                .catch(error => {
                    if (error !== ResponseCode.TransactionCancelled)
                        this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','DEBIT TRANSACTION ERROR');
                });
        }
    }

    // NAVIGATION

    gohome(){
        if (this.debug) {console.log(`%cTest.gohome()`,this.logStyle);}
        this.navCtrl.setRoot(HomePage);
    }
}
