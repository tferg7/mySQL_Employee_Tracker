-- Drops the employee_db if it exists currently --
DROP DATABASE IF EXISTS employee_DB;
-- Creates the "employee_db" database --  
CREATE DATABASE employee_DB;

-- Makes it so all of the following code will affect employee_db --
USE employee_DB;

-- Creates the table "employee", "roles", and "departments" within employee_db --
CREATE TABLE department (
 id INTEGER NOT NULL auto_increment PRIMARY KEY,
 name VARCHAR(30)
);
CREATE TABLE role (
id INTEGER NOT NULL auto_increment PRIMARY KEY,
 title VARCHAR(100) NOT NULL,
 salary DECIMAL (10,2),
 department_id INTEGER,
 FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE SET NULL
);
CREATE TABLE employee (
 id INTEGER NOT NULL auto_increment PRIMARY KEY,
  first_name VARCHAR(30) NOT NULL,
  last_name VARCHAR (30),
  role_id INTEGER,
  manager_id INTEGER NULL,
  FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE SET NULL,
  FOREIGN KEY (manager_id) REFERENCES employee(id) ON DELETE SET NULL
);


-- DEPARTMENT SEEDS -----
INSERT INTO department (name)
VALUES ("Sales");
INSERT INTO department (name)
VALUES ("Engineering");
INSERT INTO department (name)
VALUES ("Finance");
INSERT INTO department (name)
VALUES ("Legal");

-- EMPLOYEE ROLE SEEDS -------
INSERT INTO role (title, salary, department_id)
VALUES ("Lead Engineer", 150000, 2);
INSERT INTO role (title, salary, department_id)
VALUES ("Legal Team Lead", 250000, 4);
INSERT INTO role (title, salary, department_id)
VALUES ("Accountant", 125000, 3);
INSERT INTO role (title, salary, department_id)
VALUES ("Sales Lead", 100000, 1);
INSERT INTO role (title, salary, department_id)
VALUES ("Salesperson", 80000, 1);
INSERT INTO role (title, salary, department_id)
VALUES ("Software Engineer", 120000, 2);
INSERT INTO role (title, salary, department_id)
VALUES ("Lawyer", 190000, 4);

-- EMPLOYEE SEEDS -------
-- Leads are added first (no manager), then the people who report to them
INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ("Jessica", "Haze", 4, NULL),     -- 1 Sales Lead
       ("Tiffany", "Patric", 1, NULL),   -- 2 Lead Engineer
       ("Mia", "Lam", 2, NULL),          -- 3 Legal Team Lead
       ("Bently", "Lao", 6, 2),          -- 4 Software Engineer -> Tiffany
       ("Chris", "Melby", 5, 1),         -- 5 Salesperson -> Jessica
       ("Jason", "Baker", 3, NULL),      -- 6 Accountant
       ("Tom", "Nice", 7, 3);            -- 7 Lawyer -> Mia


SELECT * FROM department;
SELECT * FROM role;
SELECT * FROM employee;