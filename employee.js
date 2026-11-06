require("dotenv").config();
const mysql = require("mysql2");
const inquirer = require("inquirer");
require("console.table");

// Credentials come from .env (see .env.EXAMPLE) so they never get committed
const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "employee_DB",
});

// Small promise wrapper so each step finishes before the next prompt appears
const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    connection.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

const ACTIONS = {
  "View all employees": viewEmployees,
  "View all roles": viewRoles,
  "View all departments": viewDepartments,
  "Add employee": addEmployee,
  "Add role": addRole,
  "Add department": addDepartment,
  "Update employee role": updateEmployeeRole,
  Exit: null,
};

connection.connect((err) => {
  if (err) {
    console.error("Could not connect to MySQL. Check your .env settings.\n", err.message);
    process.exit(1);
  }
  console.log("Connected as id " + connection.threadId);
  mainMenu();
});

async function mainMenu() {
  const { action } = await inquirer.prompt({
    name: "action",
    type: "list",
    message: "What would you like to do?",
    choices: Object.keys(ACTIONS),
  });

  if (action === "Exit") {
    connection.end();
    return;
  }

  try {
    await ACTIONS[action]();
  } catch (err) {
    console.error("Something went wrong:", err.message);
  }
  mainMenu();
}

// ---------- View ----------

async function viewEmployees() {
  const rows = await query(
    `SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary,
            CONCAT(m.first_name, ' ', m.last_name) AS manager
       FROM employee e
       LEFT JOIN role r ON e.role_id = r.id
       LEFT JOIN department d ON r.department_id = d.id
       LEFT JOIN employee m ON e.manager_id = m.id
      ORDER BY e.id`
  );
  console.table("EMPLOYEES", rows);
}

async function viewRoles() {
  const rows = await query(
    `SELECT r.id, r.title, r.salary, d.name AS department
       FROM role r
       LEFT JOIN department d ON r.department_id = d.id
      ORDER BY r.id`
  );
  console.table("ROLES", rows);
}

async function viewDepartments() {
  const rows = await query("SELECT id, name FROM department ORDER BY id");
  console.table("DEPARTMENTS", rows);
}

// ---------- Add ----------

async function addDepartment() {
  const { name } = await inquirer.prompt({
    name: "name",
    type: "input",
    message: "What is the name of the new department?",
    validate: (v) => (v.trim() ? true : "Please enter a name."),
  });
  await query("INSERT INTO department (name) VALUES (?)", [name.trim()]);
  console.log(`Added department: ${name.trim()}`);
}

async function addRole() {
  const departments = await query("SELECT id, name FROM department ORDER BY name");
  if (!departments.length) {
    console.log("Add a department first.");
    return;
  }
  const answer = await inquirer.prompt([
    {
      name: "title",
      type: "input",
      message: "What is the name of the role?",
      validate: (v) => (v.trim() ? true : "Please enter a title."),
    },
    {
      name: "salary",
      type: "input",
      message: "What is the salary for this role?",
      validate: (v) => (!isNaN(parseFloat(v)) && parseFloat(v) >= 0 ? true : "Please enter a number."),
    },
    {
      name: "departmentId",
      type: "list",
      message: "Which department is this role in?",
      choices: departments.map((d) => ({ name: d.name, value: d.id })),
    },
  ]);
  await query("INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)", [
    answer.title.trim(),
    parseFloat(answer.salary),
    answer.departmentId,
  ]);
  console.log(`Added role: ${answer.title.trim()}`);
}

async function addEmployee() {
  const roles = await query("SELECT id, title FROM role ORDER BY title");
  const employees = await query("SELECT id, first_name, last_name FROM employee ORDER BY last_name");
  if (!roles.length) {
    console.log("Add a role first.");
    return;
  }
  const answer = await inquirer.prompt([
    {
      name: "firstName",
      type: "input",
      message: "Employee's first name?",
      validate: (v) => (v.trim() ? true : "Please enter a first name."),
    },
    { name: "lastName", type: "input", message: "Employee's last name?" },
    {
      name: "roleId",
      type: "list",
      message: "Employee's role?",
      choices: roles.map((r) => ({ name: r.title, value: r.id })),
    },
    {
      name: "managerId",
      type: "list",
      message: "Employee's manager?",
      choices: [
        { name: "None", value: null },
        ...employees.map((e) => ({ name: `${e.first_name} ${e.last_name}`, value: e.id })),
      ],
    },
  ]);
  await query(
    "INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)",
    [answer.firstName.trim(), answer.lastName.trim(), answer.roleId, answer.managerId]
  );
  console.log(`Added employee: ${answer.firstName.trim()} ${answer.lastName.trim()}`);
}

// ---------- Update ----------

async function updateEmployeeRole() {
  const employees = await query("SELECT id, first_name, last_name FROM employee ORDER BY last_name");
  const roles = await query("SELECT id, title FROM role ORDER BY title");
  if (!employees.length || !roles.length) {
    console.log("You need at least one employee and one role.");
    return;
  }
  const answer = await inquirer.prompt([
    {
      name: "employeeId",
      type: "list",
      message: "Which employee would you like to update?",
      choices: employees.map((e) => ({ name: `${e.first_name} ${e.last_name}`, value: e.id })),
    },
    {
      name: "roleId",
      type: "list",
      message: "What is their new role?",
      choices: roles.map((r) => ({ name: r.title, value: r.id })),
    },
  ]);
  await query("UPDATE employee SET role_id = ? WHERE id = ?", [answer.roleId, answer.employeeId]);
  console.log("Employee role updated.");
}
