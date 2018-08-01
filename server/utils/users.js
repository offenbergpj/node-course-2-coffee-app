[{
    id: 341314131241,
    name: 'Andrew',
    room: 'Office 1'
}]

// addUser(id, name, room)
// removeUser(id)
// getUser(id)
// getUserList(room)

class Users {
    constructor () {
        this.users = [];
    }
    addUser (id, name, group) {
        var user = { id, name, group };
        this.users.push(user);
        return user;
    }

    removeUser (id) {
        var user = this.getUser(id);

        if (user) {
            this.users = this.users.filter((user) => user.id !== id);
        }
        return user;
    }

    getUser (id) {
        return this.users.filter((user) => user.id === id)[0];
    }

    getUserList(group) {
        var users = this.users.filter((user) => user.group === group);
        var namesArray = users.map((user) => user.name);
        return namesArray;
    }

    isNameTaken(name, group) {
        var user = this.users.filter(user => (name === user.name && group === user.group))[0];
        return user ? true : false;
    }
}

module.exports = { Users };
