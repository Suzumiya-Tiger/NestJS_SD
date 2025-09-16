const mysql = require('mysql2/promise');

/* const connection = mysql.createConnection({
  host: '127.0.0.1',  // 使用 127.0.0.1 而不是 localhost
  port: 3306,
  user: 'root',
  password: '177376',
  database: 'practice'
});

// 添加连接错误处理
connection.on('error', function(err) {
  console.log('数据库连接错误:', err);
});
 */
/* connection.query(
  'SELECT * FROM customers',
  function (err, results, fields) {
    // 首先检查是否有错误
    if (err) {
      console.log('查询错误:', err);
      return;
    }
    
    console.log('results', results);
    
    // 检查 fields 是否存在再调用 map
    if (fields && fields.length > 0) {
      console.log('fields', fields.map(item => item.name));
    } else {
      console.log('fields 为空或未定义');
    }
  }
); */


/* connection.query(
  'SELECT * FROM customers WHERE name LIKE ?',
  ['李%'],
  function(err,results,fields){
    console.log('results',results);
    console.log('fields',fields.map(item=>item.name));
    
    
  }
) */

/*   connection.query(
    'INSERT INTO customers (name) VALUES (?)',
    ['李良'],
    function(err,results,fields){
      console.log('results',results);
    }
  ) */

/*     connection.query(
      'DELETE FROM customers WHERE name = ?',
      ['李良'],
      function(err,results,fields){
        console.log('results',results);
      }
    ) */

      // Promise
/* (async function (){
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '177376',
    database: 'practice'
  });
   const [results,fields] = await connection.query('SELECT * FROM customers');
   console.log('results',results);
   console.log('fields',fields.map(item=>item.name));
})(); */


// 连接池
(async function (){
const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '177376',
  database: 'practice',
  waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10, 
        idleTimeout: 60000,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
});
const [results,fields] = await pool.query('SELECT * FROM customers');
console.log('results',results);
console.log('fields',fields.map(item=>item.name));


const connection = await pool.getConnection();

const [results2] = await connection.query('select * from orders');
console.log(results2);
})()
// 可选：在完成后关闭连接
// connection.end();




