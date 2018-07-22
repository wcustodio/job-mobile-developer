import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Platform } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { DatabaseProvider } from './database';
import { LocationStrategy } from '../../node_modules/@angular/common';

const LOCATION_INTERVAL = 180000;

@Injectable()
export class LocationProvider {
    private intervalId: any;

    constructor(
        private platform: Platform, 
        private geolocation: Geolocation,
        private database: DatabaseProvider
    ) {
    }

    startWatchPosition() {
        this.getLocation().subscribe(res => {
            //armazena a primeira localização
            this.saveLocation(res);

            //inicia o processo para capturar a localização a cada 3 minutos
            this.intervalId = setInterval(() => {
                this.getLocation().subscribe(res => {
                    this.saveLocation(res);
                })
            }, LOCATION_INTERVAL)
        })
    }

    stopWatchPosition() {
        clearInterval(this.intervalId);
    }

    saveLocation(location) {
        this.database.executeSql('INSERT INTO locations(date, latitude, longitude, sync) VALUES(?,?,?,?)', [location.date, location.latitude, location.longitude, false]).subscribe(res => {
            console.log('coordenadas armazenada');
        }, err => {
            console.error('falha ao salvar a localização', err);
        })
    }
    
    getLocation() {
        return Observable.create(observer => {
            if (this.platform.is('cordova')) {
                //obtém a localização com modo de alta precisão
                this.geolocation.getCurrentPosition({
                    timeout: 6000,
                    enableHighAccuracy: true
                }).then(res => {
                    observer.next({
                        latitude: res.coords.latitude,
                        longitude: res.coords.longitude,
                        date: new Date()
                    });
                    observer.complete();
                }).catch((err) => {
                    console.error('Error getting location', err);
                    observer.error(err);
                });             
            } else {
                //localização fake para rodar fora do device no ambiente de teste
                observer.next({
                    longitude: -3.60512,
                    latitude: 55.070859,
                    date: new Date()
                });
                observer.complete();
            }
        })  
    }
}
