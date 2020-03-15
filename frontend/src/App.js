import React, { Component } from 'react';
import {BrowserRouter as Router, Switch, Route} from "react-router-dom";
import Player from './components/Player';
import Home from './components/Home';
import 'antd/dist/antd.css'

const App = (props) => {

    return (
        <Router>
            <Switch>
                <Route path="/" component={Home} />
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
