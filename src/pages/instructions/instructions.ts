import { Component } from '@angular/core';
import { AlertController, NavController } from 'ionic-angular';
import { ConfigService } from '../../providers/config.service';
import { Ingenico } from '../../providers/ingenico';
import { SamplePage } from '../pages';

@Component({
    selector    : 'instructions-page',
    templateUrl : 'instructions.html'
})

export class InstructionsPage {

    logStyle         : string ;
    debug            : boolean;
    ingenicoConfig   : any;
    className        : string =  'instructions';

    constructor(
        public alertCtrl: AlertController,
        public configService: ConfigService,
        public ingenico: Ingenico,
        public navCtrl: NavController
    ){
        this.debug          = this.configService.getDebug();
        this.logStyle       = this.configService.getLogStyles().pages;
        this.ingenicoConfig = this.configService.getIngenicoConfig();
        if (this.debug) { console.log(`%cHome.constructor()`, this.logStyle); }
    }

    ionViewDidEnter() {
        // send to test page if we are good
        if (this.ingenicoConfig.username !== '') {
            if (this.debug) { console.log(`%cHome.ionViewDidEnter() : Sent To SamplePage`, this.logStyle); }
            this.navCtrl.setRoot(SamplePage);
        } else {
            if (this.debug) { console.log(`%cHome.ionViewDidEnter()`, this.logStyle); }
            this.className = 'instructions on';
        }
    }

    ionViewDidLeave() {
        if (this.debug) { console.log(`%cHome.ionViewDidLeave()`, this.logStyle); }
    }
}
