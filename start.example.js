const start = require("dist").start;

start({
    cgroup: "test",
    chroot: "/path/to/rootfs",
    password: "your password",
    server: "your server",
    user: "root",
    username: "your username",
});