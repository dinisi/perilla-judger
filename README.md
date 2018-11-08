# PerillaJudger
Judger for Perilla


## How to have a RootFS folder
```shell
tar -xzvf alpine-minirootfs-3.8.1-x86_64.tar.gz -C ~/RootFS
```

## How to mount necessary things to RootFS system
```shell
sudo mount -t proc proc RootFS/proc/
sudo mount -t sysfs sys RootFS/sys/
sudo mount -o bind /dev RootFS/dev/
sudo mount -o bind /dev RootFS/dev/pts
```

## Why I cannot access network?
```shell
cp /etc/resolv.conf RootFS/etc
```

## The fucking GFW blocked alpinelinux.org!
```shell
sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories
```