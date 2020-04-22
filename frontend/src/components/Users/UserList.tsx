import React from 'react';
import User from './user.type'

interface Props {
    userList: User[]
    currentUserId: string;
}

const UserList: React.FC<Props> = (props) => {

    let users = props.userList.map((user) => {
        return (
            <li key={user.id}>
                {user.name}
                {props.currentUserId === user.id ? '*' : '' }
            </li>
        )
    })
    
    return (
        <>
            <h4>Count: {props.userList.length}</h4>
            <ul>
                {users}
            </ul>
        </>
    )
}

export default UserList;