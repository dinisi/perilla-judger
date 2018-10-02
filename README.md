# LightJudger
Judger for LightOnlineJudge

```shell
tar -xzvf alpine-minirootfs-3.8.1-x86_64.tar.gz -C ~/RootFS
```

```shell
sudo mount -t proc proc RootFS/proc/
sudo mount -t sysfs sys RootFS/sys/
sudo mount -o bind /dev RootFS/dev/
sudo mount -o bind /dev RootFS/dev/pts
```
