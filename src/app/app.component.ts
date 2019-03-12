import { Component, ViewChild } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { InstructionsPage } from '../pages/pages';
import { ConfigService } from '../providers/services';

@Component({
    templateUrl: 'app.html'
})

export class MyApp {

   @ViewChild('myNav') nav: NavController;

    rootPage : any = InstructionsPage;
    logStyle : string ;
    debug    : boolean;

    constructor(
        platform: Platform,
        statusBar: StatusBar,
        splashScreen: SplashScreen,
        public configService: ConfigService
    ) {
        this.debug     = this.configService.getDebug();
        this.logStyle  = this.configService.getLogStyles().app;
        if (this.debug) {console.log(`%cMyApp.constructor()`,this.logStyle);}
        // platform ready events
        platform.ready().then(() => {
            if (this.debug) {console.log(`%c******* PLATFORM READY FIRED *******`,this.configService.getLogStyles().platformReady);}
            statusBar.styleDefault();
            splashScreen.hide();
        });
    }
}

