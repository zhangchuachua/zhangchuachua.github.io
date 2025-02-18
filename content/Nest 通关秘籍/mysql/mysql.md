## SQL 语句的执行顺序

> 来自于 gpt

SQL 查询的执行顺序与我们编写 SQL 语句的顺序不同。SQL 引擎会按照特定的顺序来解析和执行查询，以生成最终结果。以下是 SQL 执行过程的详细步骤，以你的查询为例：

```SQL
select
    customers.id,
    customers.name,
    sum(orders.total_amount) as total,
    concat(round(100 * sum(orders.total_amount) / total_sum.total, 2), '%') as percentage
from customers
    join orders on customers.id = orders.customer_id
    join (select sum(total_amount) as total from orders) as total_sum
group by customers.id, customers.name;
```

> [!important] 上面 select 中的两个 `sum(orders.total_amount)` 虽然有结果是一样的，但是 sql 引擎并不会把第一次的结果缓存下来在第二次中使用；而是会重新执行 sum；

### SQL 查询执行顺序

1. **FROM 子句**：
    - SQL 引擎首先处理 `FROM` 子句，决定查询的数据来源。
    - 在你的查询中，它首先处理 `customers` 表，然后与 `orders` 表进行 `JOIN` 操作。
2. **JOIN 子句**：
    - SQL 引擎处理 `JOIN` 子句，将 `customers` 表与 `orders` 表根据 `customers.id = orders.customer_id` 进行连接。
    - 同时，还会处理子查询 `(select sum(total_amount) as total from orders)`，计算出订单总金额 `total_sum`。
3. **WHERE 子句** (如果有的话)：
    - 过滤记录。所有 `JOIN` 操作完成后，SQL 会根据 `WHERE` 子句的条件过滤记录。
    - 你的查询中没有 `WHERE` 子句，所以这一步被跳过。
4. **GROUP BY 子句**：
    - 在完成连接和过滤操作后，SQL 引擎会根据 `GROUP BY` 子句中的列将数据分组。
    - 在你的查询中，数据根据 `customers.id` 和 `customers.name` 进行分组。
5. **HAVING 子句** (如果有的话)：
    - 如果有 `HAVING` 子句，SQL 会在分组后对每个分组应用过滤条件。
    - 你的查询中没有 `HAVING` 子句，所以这一步也被跳过。
6. **SELECT 子句**：
    - 处理 `SELECT` 子句中的表达式。SQL 引擎会计算并生成每一列的值。
    - 在这一步，SQL 引擎会计算 `sum(orders.total_amount)`，为每个分组生成总金额，并计算 `concat(round(100 * sum(orders.total_amount) / total_sum.total, 2), '%')` 以生成百分比。
7. **ORDER BY 子句** (如果有的话)：
    - SQL 会根据 `ORDER BY` 子句对最终结果集进行排序。
    - 你的查询中没有 `ORDER BY` 子句，所以这一步被跳过。
8. **LIMIT 子句** (如果有的话)：
    - 最后，如果有 `LIMIT` 子句，SQL 引擎会在排序后，返回指定数量的记录。
    - 你的查询中没有 `LIMIT` 子句，所以这一步也被跳过。

### 执行顺序示意图

- `FROM` (选择 `customers` 表)
- `JOIN` (连接 `orders` 表，并执行子查询计算 `total_sum`)
- `GROUP BY` (按 `customers.id` 和 `customers.name` 分组)
- `SELECT` (计算 `sum(orders.total_amount)` 和 `percentage` 列)
- 生成最终结果集

这个执行顺序确保 SQL 查询的各个部分能够依次执行，从而生成正确的最终结果。

---

## 简单汇总

---

更新语法： `update table set field = 'xx' where ...`

---

下面是最基础的 select 的部分语法和函数，还有更高级的语法；

- **where**：查询条件，比如 where id=1
- **as**：别名，比如 select xxx as 'yyy'
- **and**: 连接多个条件
- **in/not in**：集合查找，比如 `where a in (1,2)`
- **between and**：区间查找，比如 `where a between 1 and 10` 查找 1-10 之间的 a, 与 `where a > 1 and a < 10` 一个意思
- **limit**：分页，比如 `limit 0,5` 表示从 0 到 5 的数据，如果是 `limit 5, 5` 那么就是从 5 到 10
- **order by**：排序，可以指定先根据什么升序、如果相等再根据什么降序，比如 `order by a desc,b asc`
- **group by**：分组，比如 `group by aaa`
- **having**：**分组之后**再过滤，比如 `group by aaa having xxx > 5`
- **distinct**：去重： `select distinct class from student`

sql 还可以用很多内置函数：

- 聚合函数：avg、count、sum、min、max
- 字符串函数：concat、substr、length、upper、lower
- 数值函数：round、ceil、floor、abs、mod
- 日期函数：year、month、day、date、time
- 条件函数：if `if(score>=60, '及格', '不及格')` 类似于三目运算符、case 这个才是 if-else `case when score >= 90 then '优秀' when score >= 60 then '良好' else '差' end`
- 系统函数：version、datebase、user
- 类型转换函数：
    - convert： `covert(’123’, signed)` 转换为整数
    - cast: `` `case('123' as signed) ``
        - signed：整型；
        - unsigned：无符号整型
        - decimal：浮点型；
        - char：字符类型；
        - date：日期类型；
        - time：时间类型；
        - datetime：日期时间类型；
        - binary：二进制类型
    - date_format、str_to_date
- 其他函数：
    - nullif: `nullif(1, 1), nullif(1,2)` 如果相等返回 nul 如果不想等返回第一个值
    - coalesce: `coalesce(null, 1), coalesce(null, null, 2)` 返回第一个非 nul 的值；如果都是 null 则返回 null
    - greatest: 返回最大的值
    - least: 返回最小的值

## 外键约束

外键一共有四个类型

![[image 2.png|image 2.png]]

1. CASCADE: 主表主键更新，从表外键跟着更新；主表主键删除，从表跟着删除
2. SET NULL: 主表主键更新或删除，从表将会设置为 NULL
3. RESTRICT 与 NO ACTION: 这两个类型起到的效果是一样的；当没有从表的关联记录时，才允许删除主表记录或者更新主表的主键 ID
    
    ![[image 1 2.png|image 1 2.png]]
    
    更新主键时失败，因为正在被使用；
    

## 事务基础

事务有四个属性，通常称为 ACID

1. 原子性：要求每个事物都是“全有或全无”。如果事务一部分失败了，那么整个事务都会失败。
2. 一致性：确保任何事务都会将数据库从一种有效状态转变成另一种有效状态，并且不会出现中间状态
3. 隔离性：每个事务之间都应该是隔离的，不同的事务之间不会也不能互相影响
4. 持久性：事务成功，那么事务中发生的数据修改都会永久保留在系统中，无论其他事务情况如何；

[![](https://ucarecdn.com/adc32f41-3ba0-4407-84bd-2b409259ef4b/)](https://ucarecdn.com/adc32f41-3ba0-4407-84bd-2b409259ef4b/)

### 事务的基础语法：

1. 开始： `start transaction`
2. 暂存点： `savepoint` 可以使用 `rollback to savepoint xxx` 进行部分回滚；
3. 回滚： `rollback`
4. 提交事务: `commit`
5. 离开事务： `leave`

一般来说，事务之间的 sql 如果遇到了未被捕获的错误，那么都会自动进行回滚；但是显式添加 `rollback` 可以确保事务回滚，并且有更好的错误处理，可以避免隐式行为依赖，保证 sql 代码的明确性；

  

下面是一个示例：

```SQL
START TRANSACTION;

-- 从 Alice 账户转账 200 给 Bob 账户
UPDATE accounts SET balance = balance - 200 WHERE name = 'Alice';
IF ROW_COUNT() = 0 THEN
    -- 如果没有行被更新，回滚事务
    ROLLBACK;
    -- 输出错误信息（在存储过程或其他脚本中）
    SELECT 'Error: No rows affected for Alice account.';
    LEAVE; -- 结束事务处理 不加的话会继续向下执行
END IF;

-- 记录转账信息
INSERT INTO transactions (from_account_id, to_account_id, amount) 
VALUES ((SELECT id FROM accounts WHERE name = 'Alice'), (SELECT id FROM accounts WHERE name = 'Bob'), 200);

-- 更新 Bob 的账户余额
UPDATE accounts SET balance = balance + 200 WHERE name = 'Bob';
IF ROW_COUNT() = 0 THEN
    -- 如果没有行被更新，回滚事务
    ROLLBACK;
    -- 输出错误信息
    SELECT 'Error: No rows affected for Bob account.';
    LEAVE; -- 结束事务处理
END IF;

-- 模拟一个错误情况
IF 1 = 0 THEN
    -- 这里故意使用一个永远为假的条件来模拟错误
    ROLLBACK;
    -- 输出错误信息
    SELECT 'Error: Simulated error occurred.';
    LEAVE; -- 结束事务处理
END IF;

-- 如果一切顺利，提交事务
COMMIT;
```

  

### 事务隔离：定义了事务之间如何相互隔离

1. `read uncommitted` 可以读到别的事务尚未提交的数据，可能导致「脏读」
    1. 事务 a 更新了一个账户的余额，但还未提交
    2. 事务 b 读取了这个尚未提交的新余额，并基于这个值做了一些操作；
    3. 如果事务 a 随后回滚，那么事务 b 所做的操作就是错误的；
2. `read committed` 一个事务只能读取到另一个事务已经提交的数据，脏读不会发生，但是可能「不可重复读」：
    1. 事务 a 读取了一个账户的余额
    2. 事务 b 随后修改了这个账户的余额并提交
    3. 事务 a 再次读取这个账户的余额时，发现数据数据已经修改；这就导致了不可重复读的问题
3. `repeatable read` 可重复读：一个事务在读取某行数据时，其他事务不能对==该行数据(仅仅是改行数据，所以添加新行是允许的)==进行更新，直到当前事务结束。这确保了同一事务中多次读取同一数据时数据是一致的；但是可能导致幻读的问题：
    1. 事务 a 读取了一个满足特定条件的行集
    2. 事务 b 随后插入了一些新行，这些行也满足事务 a 的条件并提交
    3. 事务 a 再次读取时，发现多了一些行，这些行在第一次读取时并不存在，这就是幻读
4. `serializable` 可序列化：所有的事务都被强制串行执行，仿佛事务是一个接一个地顺序执行的；这样没有任何的并发问题，但是代价是性能下降

  

可以使用 `**select**` `@@transaction_isolation` 查询当前的事务隔离级别； mysql8 的默认值是 `repeatable read` 可重复读

## 联表查询

总共分为四类

1. [INNER] JOIN: 默认值，交集
2. LEFT/RIGHT JOIN: 返回左表或右表的全部；
3. FULL [OUTER] JOIN: 返回左表和右表的全部；

![[image 2 2.png|image 2 2.png]]

1. CROSS JOIN: 将左表中的每条记录与右表中的每条记录连接起来(算法如下图所示）
    
    ![[image 3.png]]
    
      
    
    ![[image 4.png]]
    

## 子查询与 EXISTS

### 子查询

```SQL
-- 先将最高分查询出来，然后根据结果查询对应的 name, clas
select name, class from student where score = (select MAX(score) from student);

-- 先计算出平均分，然后根据结果查询高于平局分的学生
select * from student where score > (select AVG(score) from student);
```

> 子查询不止 `select` 中可以使用，还可以在 `insert, update, delete` 中使用；

```SQL
# 将技术部员工的名字前面统统加上 engineer_ ；
update employment set name = concat('engineer_', name)
	where deparment_ud = (
		select id from department where name = '技术部'
	)
```

### EXISTS 与 NOT EXISTS

```SQL
# 获取所有有员工的部门名字；对于每个部门，去获取该部门下的员工；如果有员工，那么就获取部门的名字；如果没有就跳过
# exists 的作用就是去判断子查询的结果是否存在；
# not exists 的作用自然相反
select name from department
	where exists(
		select * from employment where department.id = employment.department_id
	)
```

## view 视图 & 存储过程 & 函数

### 视图

其实就是相当于把常用的查询存储起来；这样后面在需要查看这样的数据时就不用重新写查询了；视图一般只用来做查询，不会用来做增删改；

```SQL
-- create view name as 基本语法
CREATE VIEW customer_orders AS 
    SELECT 
        c.name AS customer_name, 
        o.id AS order_id, 
        o.order_date, 
        o.total_amount
    FROM customers c
    JOIN orders o ON c.id = o.customer_id;
```

### 存储过程

定义：存储过程是一段预编译的SQL代码，它可以包含多条SQL语句以及流程控制语句。存储过程通常用于执行一系列操作，可以接收输入参数，并且可以返回多个值。

**特点**：

- **不一定返回值**：存储过程可以返回多个值，也可以不返回值。返回的值通常是通过 `OUT` 参数或使用 `SELECT` 语句返回的结果集。
- **复杂逻辑**：存储过程可以包含复杂的逻辑控制语句，如 `IF`，`WHILE`，`LOOP` 等。
- **执行效率高**：因为存储过程是预编译的，所以它的执行效率比单独执行多个SQL语句要高。
- **安全性**：可以通过存储过程控制对数据库的访问权限，确保数据库的安全性。

```SQL
-- IN 表示输入
-- OUT 表示输出
-- 所以这个存储过程接受两个参数
CREATE PROCEDURE UpdateEmployeeSalary(
    IN emp_id INT,
    IN new_salary DECIMAL(10, 2),
    OUT result VARCHAR(50)
)
BEGIN
		-- 为执行 sql 语句过程中可能出现的异常定义了一个处理程序，如果出现了异常，那么就会触发这个处理程序；直接 rollback 并且设置返回值
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET result = 'Error in updating salary';
    END;
    -- 开始事务
    START TRANSACTION;
    -- 更新员工的工资
    UPDATE employees SET salary = new_salary WHERE id = emp_id;
    -- 提交
    COMMIT;
    -- 设置返回值
    SET result = 'Salary updated successfully';
END;
```

### 函数

**定义**：函数是一段SQL代码，它执行特定的操作并返回一个单一的值。函数通常用于计算和数据处理，可以嵌入到SQL语句中使用。

特点：

- **必须返回值**：函数必须返回一个值，通常是标量值（如整数、字符串等）。
- **只能有** `**IN**` **参数**：函数只能接收 `IN` 参数，不能有 `OUT` 参数。
- **不能修改数据库状态**：函数的设计原则是无副作用，通常不能执行诸如 `INSERT`、`UPDATE`、`DELETE` 等操作，虽然有些数据库系统允许在某些情况下执行这些操作，但一般不推荐这样做。
- **可以嵌入SQL查询中**：函数通常可以嵌入到SQL查询中，作为表达式的一部分进行计算。

```SQL
CREATE FUNCTION GetEmployeeFullName(emp_id INT)
-- 返回值类型
RETURNS VARCHAR(255)
BEGIN
		-- 定义一个变量
    DECLARE full_name VARCHAR(255);
    SELECT CONCAT(first_name, ' ', last_name) INTO full_name FROM employees WHERE id = emp_id;
    RETURN full_name;
END;
```