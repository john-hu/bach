import React, { PureComponent } from 'react';
import MusicianCard from '../components/MusicianCard';
import {
  API_EVENTS,
  PAGE_URL
} from '../constants/Constant';
import ServerAPI from '../ws/ServerAPI';
import { initMIDI, downloadMIDI } from '../actions/MidiFile';
import Replayer from '../actions/Replayer';

class Musician extends PureComponent {

  constructor(props) {
    super(props);
    if (!this.isReady()) {
      return;
    }
    this.state = {
      activeInstrumentIndex: 0,
      activeNote: -1,
      instruments: null,
      noteText: '??',
      groupCode: props.location.state.group
    };
    // setTimeout(() => {
    //   this.handleTrackInfo([0, 1, 2, 3],
    //                        ['violin', 'contrabass'],
    //                        { song: 'pachelbel_canon' });
    // }, 1000);
  }

  componentDidMount = () => {
    const { history } = this.props;
    if (!this.isReady()) {
      // no code no show.
      history.replace(PAGE_URL.PIN_CODE);
      return;
    }

    ServerAPI.on(API_EVENTS.GROUP_TRACK_INFO, this.handleTrackInfo);
    ServerAPI.on(API_EVENTS.GROUP_CHANGED, this.handleGroupChanged);
  }

  componentWillUnmount = () => {
    ServerAPI.off(API_EVENTS.GROUP_TRACK_INFO, this.handleTrackInfo);
    ServerAPI.off(API_EVENTS.GROUP_CHANGED, this.handleGroupChanged);
  }

  isReady = () => {
    const { location } = this.props;
    return location.state && location.state.code && location.state.group && ServerAPI.ready
  }

  handleTrackInfo = (channels, instruments, group) => {
    // let speed = 60;
    this.setState({ instruments });
    Promise.all([downloadMIDI(group.song), initMIDI(instruments)]).then(([midiFile, midi]) => {
      // TODO: intercept information and set the to state.
      this.replayer = new Replayer(midiFile, window.MIDI)
      ServerAPI.musicianReady();
      // setInterval(() => {
      //   this.handleGroupChanged({ speed });
      //   if (speed >= 300) {
      //     speed -= 10;
      //   } else if (speed >= 60 && speed < 300) {
      //     speed += 10;
      //   } else {
      //     speed = 60;
      //   }
      // }, 1000)
    });
  }

  handleGroupChanged = (group) => {
    if (group && group.speed) {
      this.replayer.setSpeed(group.speed);
      if (!this.replayer.isPlaying()) {
        this.replayer.replay();
      }
    }
  }

  render = () => {
    if (!this.isReady()) {
      // no code no show.
      return null;
    }

    const {
      activeInstrumentIndex,
      instruments,
      noteText
    } = this.state;
    return (
      <MusicianCard
        activeInstrumentIndex={activeInstrumentIndex}
        instruments={instruments}
        note={noteText}
        title='Musician'
      />
    );
  }
}

export default Musician;
