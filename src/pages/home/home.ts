import { Component } from '@angular/core';
import { AlertController, NavController } from 'ionic-angular';
import { ConfigService } from '../../providers/config.service';
import { AutomaticPage, ManualPage, TerminalPage, TestPage } from '../pages';
import { Ingenico } from '../../providers/ingenico';

@Component({
    selector    : 'home-page',
    templateUrl : 'home.html'
})

export class HomePage {

    logStyle         : string ;
    debug            : boolean;
    ingenicoConfig   : any;

    constructor(
        public alertCtrl: AlertController,
        public configService: ConfigService,
        public ingenico: Ingenico,
        public navCtrl: NavController
    ){
        this.debug          = this.configService.getDebug();
        this.logStyle       = this.configService.getLogStyles().pages;
        this.ingenicoConfig = this.configService.getIngenicoConfig();
        if (this.debug) {console.log(`%cHome.constructor()`,this.logStyle);}
    }

    automatic() {
        if (this.debug) {console.log(`%cMyApp.automatic()`,this.logStyle);}
        this.navCtrl.setRoot(AutomaticPage);
    }

    manual() {
        if (this.debug) {console.log(`%cMyApp.manual()`,this.logStyle);}
        this.navCtrl.setRoot(ManualPage);
    }

    terminal() {
        if (this.debug) {console.log(`%cMyApp.terminal()`,this.logStyle);}
        this.navCtrl.setRoot(TerminalPage);
    }

    test() {
        if (this.debug) {console.log(`%cMyApp.test()`,this.logStyle);}
        this.navCtrl.setRoot(TestPage);
    }
}
