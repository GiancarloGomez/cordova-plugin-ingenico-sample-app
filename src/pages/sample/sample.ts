import { Component } from '@angular/core';
import { ActionSheetController, AlertController, ModalController } from 'ionic-angular';
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
import { ChargeFormPage } from '../pages';

import * as moment from 'moment';

@Component({
    selector    : 'sample-page',
    templateUrl : 'sample.html'
})

export class SamplePage {

    logStyle         : string ;
    logEventStyle    : string ;
    debug            : boolean;
    connectionInfo   : string;
    currency         : string;
    devices          : Device[];
    ingenicoConfig   : any;
    chargeModal      : any;

    // used for UI updates but actual statuses should always be checked against SDK
    initialized      : boolean = false;
    authenticated    : boolean = false;
    deviceReady      : boolean = false;
    deviceSetup      : boolean = false;

    // for undefined properties ( used in listener creation in ionViewWillEnter )
    [x: string]: any;

    constructor(
        public alertCtrl: AlertController,
        public actionSheetCtrl: ActionSheetController,
        public configService: ConfigService,
        public ingenico: Ingenico,
        public loadingAndErrorHandling: LoadingAndErrorHandling,
        private modalCtrl: ModalController
    ){
        this.debug          = this.configService.getDebug();
        this.logStyle       = this.configService.getLogStyles().pages;
        this.logEventStyle  = this.configService.getLogStyles().events;
        if (this.debug) {console.log(`%cTest.constructor()`,this.logStyle);}
        this.ingenicoConfig = this.configService.getIngenicoConfig();
    }

    ionViewWillEnter(){
        if (this.debug) {console.log(`%cTest.ionViewWillEnter() : add event listeners`,this.logStyle);}
        // add custom event listeners
        if (!this.onDeviceSelectedBound)
            this.onDeviceSelectedBound = this.onDeviceSelected.bind(this);
        if (!this.onDeviceConnectedBound)
            this.onDeviceConnectedBound = this.onDeviceConnected.bind(this);
        if (!this.onDeviceDisconnectedBound)
            this.onDeviceDisconnectedBound = this.onDeviceDisconnected.bind(this);
        if (!this.onDeviceErrorBound)
            this.onDeviceErrorBound = this.onDeviceError.bind(this);
        document.addEventListener('Ingenico:device:selected',this.onDeviceSelectedBound,false);
        document.addEventListener('Ingenico:device:connected',this.onDeviceConnectedBound,false);
        document.addEventListener('Ingenico:device:disconnected',this.onDeviceDisconnectedBound,false);
        document.addEventListener('Ingenico:device:error',this.onDeviceErrorBound,false);
        this.isInitialized(true);
    }

    ionViewWillLeave(){
        if (this.debug) {console.log(`%cTest.ionViewWillLeave() : remove event listeners`,this.logStyle);}
        // remove custom event listeners
        document.removeEventListener('Ingenico:device:selected',this.onDeviceSelectedBound,false);
        document.removeEventListener('Ingenico:device:connected',this.onDeviceConnectedBound,false);
        document.removeEventListener('Ingenico:device:disconnected',this.onDeviceDisconnectedBound,false);
        document.removeEventListener('Ingenico:device:error',this.onDeviceErrorBound,false);
    }

    // Device Connection Listeners

    onDeviceSelected(event:any){
        if (this.debug) {console.log(`%cTest.onDeviceSelected()`,this.logEventStyle,event); }
        this.loadingAndErrorHandling.showLoading('DEVICE SELECTED','hide',true);
    }

    onDeviceConnected(){
        if (this.debug) {console.log(`%cTest.onDeviceConnected()`,this.logEventStyle); }
        this.loadingAndErrorHandling.showLoading('DEVICE CONNECTED', 'hide', true);
        this.deviceReady = true;
        setTimeout(() => {
            this.loadingAndErrorHandling.hideLoading();
        }, 1000);
    }

    onDeviceDisconnected(){
        if (this.debug) {console.log(`%cTest.onDeviceDisconnected()`,this.logEventStyle); }
        this.loadingAndErrorHandling.showLoading('DEVICE DISCONNECTED', 'hide', true);
        this.deviceReady = this.deviceSetup = false;
        setTimeout(() => {
            this.loadingAndErrorHandling.hideLoading();
        }, 1000);
        this.isInitialized(true);
    }

    onDeviceError(event){
        if (this.debug) {console.log(`%cTest.onDeviceError()`,this.logEventStyle,event.detail); }
        this.loadingAndErrorHandling.showError(this.getErrorForResponseCode(event.detail), '', 'DEVICE ERROR');
    }

    getErrorForResponseCode(error) {
        if (this.debug) { console.log(`%cTest.getErrorForResponseCode()`,this.logStyle,error); }
        let errorCode = 0;
        // responses from onDeviceError comeback as error:code
        if (error.toString().indexOf(':') !== -1)
            errorCode = parseInt(error.split(':')[1]);
        else
            errorCode = parseInt(error);
        if ( !isNaN(errorCode) )
            error = ResponseCode.getDescriptionForResponse(ResponseCode.getResponseByNumber(errorCode));
        return error;
    }

    // Authentication

    initialize() {
        if (this.debug) { console.log(`%cTest.initialize()`, this.logStyle); }

        this.ingenico.initialize(this.ingenicoConfig.apiKey, this.ingenicoConfig.baseUrl, this.ingenicoConfig.clientVersion)
            .then(result => {
                this.initialized = result;
                this.updateConnectionInfo('LOGIN REQUIRED');
            })
            .catch(error => {
                if (this.debug) { console.error(`%cTest.initialize() : this.ingenico.initialize : Error : ${error}`, this.logStyle); }
                this.updateConnectionInfo();
                this.loadingAndErrorHandling.showError(this.getErrorForResponseCode(error), '', 'INITIALIZATION ERROR');
            });
    }

    login(){
        if (this.debug) {console.log(`%cTest.login()`,this.logStyle);}

        let alert = this.alertCtrl.create({
            title: 'LOGIN',
            inputs: [
                {
                    name: 'username',
                    placeholder: 'Username',
                    type: 'text',
                    value: this.ingenicoConfig.username
                },
                {
                    name: 'password',
                    placeholder: 'Password',
                    type: 'password',
                    value: this.ingenicoConfig.password
                }
            ],
            buttons: [
                {
                    text: 'CANCEL',
                    role: 'cancel'
                },
                {
                    text: 'LOGIN',
                    handler: data => {
                        this.loadingAndErrorHandling.showLoading('Processing ...');

                        this.ingenico.login(data.username, data.password)
                            .then(result => {
                                let userProfile: UserProfile = result;
                                if (this.debug) {
                                    let sessionExpires = moment(userProfile.session.expiresTime, 'YYYYMMDDHHmmss').add(moment().utcOffset(), 'm').format('MM/DD/YYYY hh:mm a');
                                    console.log(`%cTest.login() : this.ingenico.login() : expires on ${sessionExpires}`, this.logStyle, userProfile);
                                    this.updateConnectionInfo(`AUTHENTICATED : SESSION EXPIRES : ${sessionExpires}`);
                                }
                                this.authenticated = true;
                                this.currency = userProfile.configuration.currency.code;
                                this.loadingAndErrorHandling.hideLoading();
                            })
                            .catch(error => {
                                if (this.debug) { console.error(`%cTest.login() : this.ingenico.login : Error : ${error}`, this.logStyle); }
                                this.authenticated = false;
                                this.updateConnectionInfo();
                                this.loadingAndErrorHandling.showError(this.getErrorForResponseCode(error), '', 'LOGIN ERROR');
                            });
                    }
                }
            ]
        });
        alert.present();
    }

    logoff(){
        if (this.debug) {console.log(`%cTest.logoff()`,this.logStyle);}
        this.ingenico.logoff()
            .then(result => {
                if (this.debug) {console.log(`%cTest.logoff() : this.ingenico.logoff() : ${result}`,this.logStyle);}
                this.authenticated = false;
                this.updateConnectionInfo();
            })
            .catch(error => {
                if (this.debug) {console.error(`%cTest.logoff() : this.ingenico.logoff : Error : ${error}`,this.logStyle);}
                this.authenticated = false;
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
                    this.authenticated = true;
                    this.currency = userProfile.configuration.currency.code;
                } else {
                    this.authenticated = false;
                }
            })
            .catch(error => {
                if (this.debug) {console.error(`%cTest.refreshUserSession() : this.ingenico.refreshUserSession : Error : ${error}`, this.logStyle);}
                this.authenticated = false;
                this.updateConnectionInfo();
                this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','REFRESH SESSION ERROR');
            });
    }

    isInitialized(checkLogin:boolean = false) {
        if (this.debug) { console.log(`%cTest.isInitialized()`, this.logStyle); }
        this.ingenico.isInitialized()
            .then(result => {
                if (this.debug) { console.log(`%cTest.isInitialized() : this.ingenico.isInitialized(${result})`, this.logStyle); }
                this.initialized = result;
                this.updateConnectionInfo();
                if (this.initialized && checkLogin)
                    this.isLoggedIn(false);
            })
            .catch(error => {
                if (this.debug) { console.error(`%cTest.isInitialized() : this.ingenico.isInitialized : Error : ${error}`, this.logStyle); }
                this.updateConnectionInfo();
                this.loadingAndErrorHandling.showError(this.getErrorForResponseCode(error), '', 'IS INITIALIZED ERROR');
            });
    }

    isLoggedIn(showAlert:boolean = true){
        if (this.debug) {console.log(`%cTest.isLoggedIn()`,this.logStyle);}
        this.ingenico.isLoggedIn()
            .then(result => {
                if (this.debug) { console.log(`%cTest.isLoggedIn() : this.ingenico.isLoggedIn(${result})`,this.logStyle); }
                this.authenticated = result;
                if (showAlert)
                    this.loadingAndErrorHandling.showAlert(this.authenticated ? 'YES' : 'NO', '', 'IS LOGGED IN?');
                if (this.authenticated)
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
        this.connectionInfo = (value === '') ? (this.initialized ? 'LOGIN REQUIRED' : 'INITIALIZATION REQUIRED') : value;
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
                this.loadingAndErrorHandling.showAlert(DeviceType.getTypeByPosition(result),'','DEVICE TYPE');
            })
            .catch(error => {
                if (this.debug) {console.error(`%cTest.getDeviceType() : this.ingenico.getDeviceType : Error : ${error}`,this.logStyle);}
                this.loadingAndErrorHandling.showError(this.getErrorForResponseCode(error),'','DEVICE TYPE ERROR');
            });
    }

    getDeviceSerialNumber() {
        if (this.debug) { console.log(`%cTest.getDeviceSerialNumber()`, this.logStyle); }
        this.ingenico.getDeviceSerialNumber()
            .then(result => {
                if (this.debug) { console.log(`%cTest.getDeviceSerialNumber() : this.ingenico.getDeviceSerialNumber()`, this.logStyle, result); }
                this.loadingAndErrorHandling.showAlert(result, '', 'DEVICE SERIAL NUMBER');
            })
            .catch(error => {
                if (this.debug) { console.error(`%cTest.getDeviceSerialNumber() : this.ingenico.getDeviceSerialNumber : Error : ${error}`, this.logStyle); }
                this.loadingAndErrorHandling.showError(this.getErrorForResponseCode(error), '', 'DEVICE SERIAL NUMBER ERROR');
            });
    }

    // Device Connection and Setup

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
                // reset on manual disconnect - checked on callback if registered
                // callback may not fire if device was already selected before paged view
                if (result)
                    this.initialized = this.authenticated = false;
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
                this.deviceReady = result;
                this.loadingAndErrorHandling.showAlert(result ? 'YES' : 'NO','','DEVICE CONNECTED');
            })
            .catch(error => {
                if (this.debug) {console.error(`%cTest.isDeviceConnected() : this.ingenico.isDeviceConnected : Error : ${error}`,this.logStyle);}
                this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','IS DEVICE CONNECTED ERROR');
            });
    }

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
                this.loadingAndErrorHandling.showAlert(result ? 'DEVICE TYPE SET' : 'DEVICE TYPE NOT SET','','DEVICE TYPE SET');
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
                this.loadingAndErrorHandling.showAlert(result ? 'DEVICE TYPE SET' : 'DEVICE TYPE NOT SET','','DEVICE TYPE SET');
            })
            .catch(error => {
                this.loadingAndErrorHandling.showError( this.getErrorForResponseCode(error),'','SET BAD DEVICE TYPE ERROR');
            });
    }

    setupDevice() {
        if (this.debug) { console.log(`%cTest.setupDevice()`, this.logStyle); }
        this.loadingAndErrorHandling.showLoading('SETTING UP DEVICE', 'hide', true);
        this.ingenico.setupDevice()
            .then(result => {
                this.deviceSetup = true;
                if (this.debug) { console.log(`%cTest.setupDevice():ingenico.setupDevice() = ${result}`, this.logStyle); }
                this.loadingAndErrorHandling.showAlert(result ? 'SETUP COMPLETE' : 'SETUP FAILED', '', 'DEVICE SETUP');
            })
            .catch(error => {
                this.loadingAndErrorHandling.showError(this.getErrorForResponseCode(error), '', 'DEVICE SETUP ERROR');
            });
    }

    configureIdleShutdownTimeout() {
        if (this.debug) { console.log(`%cTest.configureIdleShutdownTimeout()`, this.logStyle); }

        let alert = this.alertCtrl.create({
            title: 'Set timeout',
            message: 'Set timeout between 180-1800 seconds',
            inputs: [
                {
                    name: 'timeout',
                    placeholder: '180 - 1800',
                    type:'tel'
                }
            ],
            buttons: [
                {
                    text: 'CANCEL',
                    role: 'cancel'
                },
                {
                    text: 'SAVE',
                    handler: data => {
                        this.ingenico.configureIdleShutdownTimeout(data.timeout)
                            .then(result => {
                                if (this.debug) { console.log(`%cTest.configureIdleShutdownTimeout():ingenico.configureIdleShutdownTimeout() = ${result}`, this.logStyle); }
                                this.loadingAndErrorHandling.showAlert(result ? 'COMPLETED' : 'FAILED', '', 'DEVICE TIMEOUT');
                            })
                            .catch(error => {
                                this.loadingAndErrorHandling.showError(this.getErrorForResponseCode(error), '', 'DEVICE SETUP ERROR');
                            });
                    }
                }
            ]
        });
        alert.present();
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
        let data    = {
                transactionType : transactionType,
                doTransaction   : this.doTransaction.bind(this)
            },
            options = {
                enableBackdropDismiss: false
            };
        this.chargeModal = this.modalCtrl.create(ChargeFormPage, data, options);
        this.chargeModal.present();
    }

    doTransaction(transactionType: string, total: number, subTotal: number, tax: number, discount: number, discountDescription: string, tip: number, surcharge: number){
        if (this.debug) {console.log(`%cTest.doTransaction()`,this.logStyle,arguments);}
        let amount = new Amount(total, subTotal, tax, discount, discountDescription, tip, this.currency, surcharge),
            notes   = `This is a transaction note from Test.doTransaction(${transactionType})`,
            groupID = "",
            request;

        // hide modal
        this.chargeModal.dismiss();

        if (transactionType === 'cash')
            this.loadingAndErrorHandling.showLoading(`Processing ${transactionType} transaction ...`.toUpperCase());
        else
            this.loadingAndErrorHandling.showLoading(`Finalize ${transactionType} transaction on device`.toUpperCase(),'hide');

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
                    else
                        this.loadingAndErrorHandling.hideLoading();
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
                        this.loadingAndErrorHandling.showError(this.getErrorForResponseCode(error), '', 'CREDIT TRANSACTION ERROR');
                    else
                        this.loadingAndErrorHandling.hideLoading();
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
                        this.loadingAndErrorHandling.showError(this.getErrorForResponseCode(error), '', 'DEBIT TRANSACTION ERROR');
                    else
                        this.loadingAndErrorHandling.hideLoading();
                });
        }
    }
}
