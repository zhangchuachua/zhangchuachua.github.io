源于[掘金小册](https://juejin.cn/book/7226988578700525605)

> 国内从 Docker Hub 拉去镜像时可能会遇到困难(我是在执行 `docker compose up` 时遇到了报错；但是执行 `docker pull` 又没有问题)；这种情况可以通过镜像加速期解决；参考：[https://yeasy.gitbook.io/docker_practice/install/mirror](https://yeasy.gitbook.io/docker_practice/install/mirror)

> [!important] 我在学习 `nest` 时还遇到一个问题；在使用 `docker compose` 将 `nest` 与 `mysql` 打包到一个 `image` 时；`nest` 不能再使用 `localhost` 连接 `mysql` 了；此时也不能通过 mysql container 的 ip 进行连接，因为两个 `container` 依然是分开的；
> 
>   
> 需要通过宿主机网关 IP 来进行访问；宿主机网关可以使用一个 Docker 提供的特殊的 DNS 名称来解决：  
> `host.docker.internal` 例如 `{ host: 'host.docker.internal', port: 3306 }`
> 
>   
> 但是一般都是使用 ==**[桥接网络](https://yeasy.gitbook.io/docker_practice/network/linking)**== ==解决；==

[[mysql]]

[[Redis]]

[[Nginx]]