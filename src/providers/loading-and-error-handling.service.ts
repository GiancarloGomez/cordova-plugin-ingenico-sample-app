import { Injectable } from '@angular/core';
import { AlertController, Loading, LoadingController, ToastController } from 'ionic-angular';
import { ConfigService } from './config.service';

@Injectable()
export class LoadingAndErrorHandling {

    loading:Loading = null;
    private logStyle:string = '';
    private logErrorStyle:string = '';
    private debug: boolean;
    // used to only allow one alert open at a time based on state or message
    private alertOpen: boolean = false;
    private alertMessage: string = '';

    constructor(
        private alertCtrl: AlertController,
        private configService: ConfigService,
        private loadingCtrl: LoadingController,
        private toastCtrl: ToastController
    ) {
        this.debug = this.configService.getDebug();
        this.logStyle = this.configService.getLogStyles().errorProvider;
        this.logErrorStyle = this.configService.getLogStyles().fatal;
        if (this.debug) {console.log(`%cLoadingAndErrorHandling.constructor()`,this.logStyle);}
    }

    showLoading(content:string = 'Loading...',spinner:string = 'ios', newIfExists:boolean = false,enableBackdropDismiss:boolean = false) {
        if (this.debug) {console.log(`%cLoadingAndErrorHandling.showLoading(${content})`,this.logStyle);}
        if (newIfExists && this.loading)
            this.hideLoading();
        if (!this.loading){
            this.loading = this.loadingCtrl.create({
                spinner               : spinner,
                content               : content,
                enableBackdropDismiss : enableBackdropDismiss
            });
            this.loading.present();
            this.loading.onDidDismiss(()=>{
                if (this.debug) {console.log(`%cLoadingAndErrorHandling.showLoading() : dismissed`,this.logStyle);}
            });
        } else {
            this.loading.setContent(content);
        }
    }

    hideLoading() {
        if (this.debug) {console.log(`%cLoadingAndErrorHandling.hideLoading()`,this.logStyle);}
        if (this.loading){
            this.loading.dismissAll();
            this.loading = null;
        }
    }

    showError(error:any,cssClass:string = '',title:string = 'Error') {
        if (this.debug) {console.log(`%cLoadingAndErrorHandling.showError(error)`,this.logErrorStyle,error);}
        this.showAlert(error,cssClass,title);
    }

    showToast(error:any) {
        if (this.debug) {console.log(`%cLoadingAndErrorHandling.showToast()`,this.logStyle);}
        let message = '';
        let toast:any;
        if (typeof error === 'object'){
            // if object contains a message key assign it to message
            if (error.message)
                message = error.message;
            // else if it contains a body lets parse it and use the message key returned
            else if (error._body)
                message = JSON.parse(error._body).message;
        } else {
            message = error
        }
        if (message !== ''){
            // show confirmation
            toast = this.toastCtrl.create({
                message         : message,
                position        : 'middle',
                cssClass        : 'text-center',
                showCloseButton : true
            });
            toast.present();
        }
    }

    showAlert(error:any,cssClass:string = '',title:string = 'Alert') {
        if (this.debug) {console.log(`%cLoadingAndErrorHandling.showAlert()`,this.logStyle);}
            let message = '';
            this.hideLoading();
            if (typeof error === 'object'){
                if (error.stack)
                    message = error.stack;
                else if (error.message)
                    message = error.message;
                else
                    message = `Sorry but an error occured`;

            } else {
                message = error
            }
            // only open a new alert if there is not one already open
            // or the error message differs from the previous one open
            if (!this.alertOpen || this.alertMessage !== message){
                let alert = this.alertCtrl.create({
                    title       : title,
                    cssClass    : cssClass
                });
                alert.addButton({
                    text    : 'OK',
                    role    : 'cancel',
                    handler : data => {
                        this.alertOpen = false;
                    }
                });
                // set the final message to display
                alert.setMessage(message);
                alert.present();
                this.alertOpen = true;
                this.alertMessage = message;
            }
    }
}
