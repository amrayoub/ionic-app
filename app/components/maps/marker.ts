'use strict';

import { GoogleMap, GoogleMapsMarkerOptions, GoogleMapsMarker, GoogleMapsLatLng, GoogleMapsPolylineOptions, GoogleMapsPolyline } from 'ionic-native';
import { Bus } from '../../models/bus';
import { Itinerary } from '../../models/itinerary';

class Icon {
    private static BASE: string = 'www/img';
    public static GOOD: string = `${Icon.BASE}/bus_green.png`;
    public static AVG: string = `${Icon.BASE}/bus_yellow.png`;
    public static BAD: string = `${Icon.BASE}/bus_red.png`;
}

export class MarkerController {

    private map: GoogleMap;
    private markers: any = {};
    private locations: GoogleMapsLatLng[] = [];
    private trajectory: GoogleMapsPolyline;

    public constructor(map: GoogleMap) {
        this.map = map;
    }

    public setMarker(bus: Bus): void {
        if (this.markers[bus.Order]) this.updatePosition(bus);
        else this.map.addMarker(this.getMarkerData(bus)).then(marker => this.addMarker(bus, marker));
    }

    public removeMarkers(): void {
        Object.keys(this.markers).forEach((key: string) => this.removeMarker(key));
        this.locations = [];
    }

    public showTrajectory(trajectory: Itinerary): void {
        let positions: GoogleMapsLatLng[] = [];
        trajectory.Spots.forEach(spot => positions.push(new GoogleMapsLatLng(spot.Latitude.toString(), spot.Longitude.toString())));
        this.map.addPolyline(this.getTrajectoryConfiguration(positions)).then( (polyline: GoogleMapsPolyline) => this.trajectory = polyline);
    }

    public hideTrajectory(): void {
        if (this.trajectory) this.trajectory.remove();
    }

    private updatePosition(bus: Bus): void {
        this.markers[bus.Order].setPosition(new GoogleMapsLatLng(bus.Latitude.toString(), bus.Longitude.toString()));
    }

    private addMarker(bus: Bus, marker: GoogleMapsMarker): void {
        this.markers[bus.Order] = marker;
        marker.getPosition().then((latLng: GoogleMapsLatLng) => this.fitBounds(latLng));
    }

    private removeMarker(key: string): void {
        this.markers[key].remove();
        delete this.markers[key];
    }

    private getTrajectoryConfiguration(points: GoogleMapsLatLng[]): GoogleMapsPolylineOptions {
        return { points: points, color : '#0000FF', width: 5, zIndex: 4 };
    }

    private getMarkerData(bus: Bus): GoogleMapsMarkerOptions {
        return {
            position: new GoogleMapsLatLng(bus.Latitude.toString(), bus.Longitude.toString()),
            icon: { url: this.getIconPath(bus.Timestamp), size: { width: 40, height: 47 } },
            title: this.formatInfoWindow(bus),
        };
    }

    private fitBounds(location: GoogleMapsLatLng): void {
        this.locations.push(location);
        this.map.animateCamera({ 'target': this.locations });
    }

    private getIconPath(datetime: Date): string {
        let minutes: number = ((new Date()).getTime() - datetime.getTime()) / 1000 / 60;
        if (minutes > 10) return Icon.BAD;
        else if (minutes >= 5 && minutes < 10) return Icon.AVG;
        else return Icon.GOOD;
    }

    private prepareTimestamp(datetime: Date): string {
        let timeSinceUpdate: number = (new Date()).getTime() - datetime.getTime();
        timeSinceUpdate = timeSinceUpdate / 1000; // seconds
        if (timeSinceUpdate < 60) {
            return `${timeSinceUpdate.toFixed(0)} segundos`;
        }
        timeSinceUpdate = timeSinceUpdate / 60; // minutes
        if (timeSinceUpdate < 60) {
            return `${timeSinceUpdate.toFixed(0)} minutos`;
        }
        timeSinceUpdate = timeSinceUpdate / 60; // hours
        if (timeSinceUpdate < 24) {
            return `${timeSinceUpdate.toFixed(0)} horas`;
        }
        timeSinceUpdate = timeSinceUpdate / 24; // days
        return `${timeSinceUpdate.toFixed(0)} dias`;
    }

    private formatInfoWindow(bus: Bus): string {
        return `
            ${bus.Order} (${bus.Line})
            Velocidade: ${bus.Speed} Km/h
            Direção: ${bus.Direction}
            Atualizado há ${this.prepareTimestamp(bus.Timestamp)}
        `;
    }
}
