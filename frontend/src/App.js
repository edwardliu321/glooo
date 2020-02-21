import React, { Component } from 'react';
import Player from './compenents/Player';

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

class App extends Component {
  render() {
    return (
      <Router>
         <Switch>
          <Route path="/video/:roomId" component={Player} />
        </Switch>
      </Router>

    );
  }
}
export default App;
