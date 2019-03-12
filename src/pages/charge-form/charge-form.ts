import { Component } from '@angular/core';
import { ActionSheetController, AlertController, NavParams, ViewController } from 'ionic-angular';
import { ConfigService, LoadingAndErrorHandling } from '../../providers/services';
import { Ingenico } from '../../providers/ingenico';
import {
    Amount
} from '../../providers/ingenico/models';

@Component({
    selector: 'charge-form-page',
    templateUrl: 'charge-form.html'
})

export class ChargeFormPage {

    logStyle: string;
    debug: boolean;

    private amount:Amount = new Amount(0,0,0,0,'',0,'USD',0);
    private doTransaction: any;
    private transactionType: string;

    constructor(
        public alertCtrl: AlertController,
        public actionSheetCtrl: ActionSheetController,
        public configService: ConfigService,
        public ingenico: Ingenico,
        public loadingAndErrorHandling: LoadingAndErrorHandling,
        private viewCtrl: ViewController,
        params: NavParams
    ) {
        this.debug = this.configService.getDebug();
        this.logStyle = this.configService.getLogStyles().pages;
        if (this.debug) { console.log(`%cChargeFormPage.constructor()`, this.logStyle); }

        this.doTransaction = params.get('doTransaction');
        this.transactionType = params.get('transactionType');
    }

    dismiss() {
        if (this.debug) { console.log(`%cChargeFormPage.dismiss()`, this.logStyle); }
        this.viewCtrl.dismiss();
    }

    doCharge() {
        if (this.amount.total > 0){
            this.doTransaction(
                    this.transactionType,
                    this.amount.total * 100,
                    this.amount.subTotal * 100,
                    this.amount.tax * 100,
                    this.amount.discount * 100,
                    this.amount.discountDescription,
                    this.amount.tip * 100,
                    this.amount.surcharge * 100
                );
        } else {
            this.loadingAndErrorHandling.showAlert('You must enter a total value of more than 0 to process transaction.');
        }
    }

}
