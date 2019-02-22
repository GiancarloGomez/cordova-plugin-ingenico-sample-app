import { Injectable } from '@angular/core';
declare var window:any;

@Injectable()
export class ConfigService {
	private logStyle: string;
    private debug: boolean;

    constructor(
    ) {
        this.debug = this.getDebug();
        this.logStyle = this.getLogStyles().providers;
        if (this.debug) {console.log(`%cConfigService.constructor()`,this.logStyle);}
    }

    /*
    * Get debug value from window appSettings
    */
    getDebug():boolean {
        if (this.debug) {console.log(`%cConfigService.getDebug()`,this.logStyle);}
        return window.appSettings.debug || false;
    }

    /*
    * Return log styles from window.appSettings
    */
    getLogStyles(){
        return window.appSettings.styles;
    }

    /*
    * Return Ingenico config object from window.appSettings
    */
    getIngenicoConfig(){
        return window.appSettings.ingenico || {};
    }

}

