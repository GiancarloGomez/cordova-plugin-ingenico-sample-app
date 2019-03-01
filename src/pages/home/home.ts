import { Component } from '@angular/core';
import { AlertController, NavController } from 'ionic-angular';
import { ConfigService } from '../../providers/config.service';
import { AutomaticPage, ManualPage, TerminalPage } from '../pages';

@Component({
    selector    : 'home-page',
    templateUrl : 'home.html'
})

export class HomePage {

    logStyle         : string ;
    debug            : boolean;

    constructor(
        public alertCtrl: AlertController,
        public configService: ConfigService,
        public navCtrl: NavController
    ){
        this.debug     = this.configService.getDebug();
        this.logStyle  = this.configService.getLogStyles().pages;
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
}
