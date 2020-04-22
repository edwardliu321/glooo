import React, { Component } from 'react';
import {BrowserRouter as Router, Switch, Route} from "react-router-dom";
import Player from './components/Video/Player.tsx';
import Home from './components/Home.tsx';
import 'antd/dist/antd.css'

const App = (props) => {

    return (
        <Router>
            <Switch>
                <Route exact path="/" component={Home} />
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
