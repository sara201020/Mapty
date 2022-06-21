'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

/////////////////////////

class Workout {
  date = new Date();
  id = +Date.now();

  constructor(coord, distance, duration) {
    this.coord = coord;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore
    const months = [ 'January', 'February', 'March', 'April', 'May',
    'June', 'July', 'August', 'September', 'October', 'November', 'December' ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)}
     on ${this.date.getDate()} ${months[this.date.getMonth()]}`;
  }
}

class Running extends Workout {
  constructor(coord, distance, duration, cadence) {
    super(coord, distance, duration);
    this.cadence = cadence;
    this._calcPace();
    this.type = 'running';
    this._setDescription();
  }

  _calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(coord, distance, duration, elevationGain) {
    super(coord, distance, duration);
    this.elevationGain = elevationGain;
    this.type = 'cycling';
    this._setDescription();
    this._calcSpeed();
  }

  _calcSpeed() {
    this.speed = this.duration / this.distance;
    return this.speed;
  }
}

///// App
class App {
  #map;
  #eventMap;
  #workArr = [];

  constructor() {
    this._getPosition();

    inputType.addEventListener('change', this._toggleElevationField);
    form.addEventListener('submit', this._newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('couldnot find your location');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    console.log(`http://www.google.pt/maps/@${latitude}
            ,${longitude}`);

    this.#map = L.map('map').setView([latitude, longitude], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //show form
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(eMap) {
    this.#eventMap = eMap;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideform() {
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);

    //clear inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
  }

  _newWorkout(e) {
    e.preventDefault();

    let workOut;
    // get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    //check data is valid
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    //if workout running
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('invalid Number');
      }
      workOut = new Running(this.#eventMap.latlng, distance, duration, cadence);
    }

    //if workout cycling
    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevationGain) ||
        !allPositive(distance, duration, elevationGain)
      ) {
        return alert('invalid Number');
      }
      workOut = new Cycling(
        this.#eventMap.latlng,
        distance,
        duration,
        elevationGain
      );
    }

    // add obj to workout array
    this.#workArr.push(workOut);

    //render workout on map as marker
    L.marker(this.#eventMap.latlng)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          maxHeight: 200,
          autoClose: false,
          closeOnClick: false,
          className: `${workOut.type}-popup `,
        }).setContent(`${workOut.description}`)
      )
      .openPopup();

    // render workout
    this._renderWorkout(workOut);
    // hide form
    this._hideform();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _renderWorkout(workout) {
    let html = `
     <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            } </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running') {
      html += ` 
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
    }
    if (workout.type === 'cycling') {
      html += ` 
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🦶🏼' : '⛰'
            }</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workout = this.#workArr.find(work => work.id == workoutEl.dataset.id);

    this.#map.setView(workout.coord, 13);
  }
}

const app = new App();

/////////////////////////////////////////
/*
let map, eventMap;

//navigator
if ( navigator.geolocation )
    navigator.geolocation.getCurrentPosition(
        function ( position ) {
            const { latitude } = position.coords;
            const { longitude } = position.coords;

            console.log( `http://www.google.pt/maps/@${ latitude }
            ,${ longitude }` );

            map = L.map( 'map' ).setView( [ latitude, longitude ], 13 );

            L.tileLayer( 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            } ).addTo( map );

            map.on( 'click', function ( eMap ) {
                eventMap = eMap;
                form.classList.remove( 'hidden' );
                inputDistance.focus();
            } );

        },
        function () {
            alert( 'couldnot find your location' );
        }
    );

// form listener
form.addEventListener( 'submit', function ( e ) {
    e.preventDefault();

    inputDistance.value = inputDuration.value
        = inputCadence.value = inputCadence.value = '';

    L.marker( eventMap.latlng ).addTo( map )
        .bindPopup( L.popup( {
            maxWidth: 250,
            maxHeight: 200,
            autoClose: false,
            closeOnClick: false,
            className: 'running-popup'
        } ).setContent( 'work out' ) )
        .openPopup();
} );

//change workout type
inputType.addEventListener( 'change', function () {
    inputElevation.closest( '.form__row' ).classList.toggle( 'form__row--hidden' );
    inputCadence.closest( '.form__row' ).classList.toggle( 'form__row--hidden' );
} );
*/
