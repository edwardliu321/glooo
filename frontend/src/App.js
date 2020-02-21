import React, { Component } from 'react';
import Player from './components/Player';

import {BrowserRouter as Router, Switch, Route} from "react-router-dom";

const App = (props) => {

    return (
        <Router>
            <Switch>
                <Route path="/video/:roomId" component={Player} />
            </Switch>
        </Router>
    )
}

// class App extends Component {
//   render() {
//     return (
//         <Router>
//           <Switch>
//             <Route path="/video/:roomId" component={Player} />
//           </Switch>
//         </Router>
//
//     );
//   }
// }
export default App;
