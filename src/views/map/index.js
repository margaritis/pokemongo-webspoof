import axios from 'axios'

import React, { Component } from 'react'
import GoogleMap from 'google-map-react'
import { observable, action, toJS } from 'mobx'
import { observer } from 'mobx-react'
import Alert from 'react-s-alert'

import userLocation from '../../models/user-location.js'
import settings from '../../models/settings.js'

import SpeedCounter from './speed-counter.js'
import BooleanSettings from './boolean-settings.js'
import Coordinates from './coordinates.js'
import SpeedLimit from './speed-limit.js'
import Controls from './controls.js'
import TotalDistance from './total-distance.js'
import Autopilot from './autopilot.js'
import Pokeball from './pokeball.js'

@observer
class Map extends Component {

  map = null

  @observable mapOptions = {
    keyboardShortcuts: false,
    draggable: false
  }

  componentWillMount() {
    // get user geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this.handleGeolocationSuccess,
        this.handleGeolocationFail,
        { enableHighAccuracy: true, maximumAge: 0 }
      )
    }
  }

  // geolocation API might be down, use http://ipinfo.io
  // source: http://stackoverflow.com/a/32338735
  handleGeolocationFail = async (geolocationErr) => {
    Alert.warning(`
      <strong>Error getting your geolocation, using IP location</strong>
      <div class='stack'>${geolocationErr.message}</div>
    `, { timeout: 3000 })

    try {
      const { data: { loc } } = await axios({ url: 'http://ipinfo.io/' })
      const [ latitude, longitude ] = loc.split(',').map(coord => parseFloat(coord))
      this.handleGeolocationSuccess({ coords: { latitude, longitude } })
    } catch (xhrErr) {
      Alert.error(`
        <strong>Could not use IP location</strong>
        <div>Try to restart app, report issue to github</div>
        <div class='stack'>${xhrErr}</div>
      `)
    }
  }

  @action handleGeolocationSuccess({ coords: { latitude, longitude } }) {
    userLocation.replace([ latitude, longitude ])
  }

  @action toggleMapDrag = () => {
    this.mapOptions.draggable = !this.mapOptions.draggable
    this.map.setOptions(toJS(this.mapOptions))
  }

  render() {
    const [ latitude, longitude ] = userLocation

    return (
      <div className='google-map-container'>
        { /* only display google map when user geolocated */ }
        { (latitude && longitude) ?
          <GoogleMap
            ref='map'
            zoom={ settings.zoom.get() }
            center={ [ latitude, longitude ] }
            onChange={ this.handleDragMap }
            options={ () => this.mapOptions }
            onGoogleApiLoaded={ this.handleGoogleMapLoaded }
            yesIWantToUseGoogleMapApiInternals={ true }>
            <Pokeball lat={ userLocation[0] } lng={ userLocation[1] } />
          </GoogleMap> :
          <div
            style={ {
              position: 'absolute',
              top: 'calc(50vh - (100px / 2) - 60px)',
              left: 'calc(50vw - (260px / 2))'
            } }
            className='alert alert-info text-center'>
            <i
              style={ { marginBottom: 10 } }
              className='fa fa-spin fa-2x fa-refresh' />
            <div>Loading user location & map...</div>
          </div> }

        <div className='btn btn-drag-map'>
          { this.mapOptions.draggable ?
            <div
              className='btn btn-sm btn-primary'
              onClick={ this.toggleMapDrag }>
              Map draggable
            </div> :
            <div
              className='btn btn-sm btn-secondary'
              onClick={ this.toggleMapDrag }>
              Map locked
            </div> }
        </div>

        { /* controls, settings displayed on top of the map */ }
        <Coordinates />
        <SpeedCounter />
        <SpeedLimit />
        <BooleanSettings />
        <Controls />
        <TotalDistance />
        <Autopilot />
      </div>
    )
  }
}
export default Map
