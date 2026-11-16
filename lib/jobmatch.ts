// Job description match: which skills and keywords in a job post appear in the resume. Plain keyword matching.
import type { ResumeData } from "./types";
import { TECH } from "./techDates";

const EXTRA: [string, string][] = [
  ["SQL", "SQL"], ["NoSQL", "NoSQL"], ["REST APIs", "REST(?:ful)?(?:\\s*APIs?)?"], ["Microservices", "Micro-?\\s?services?"], ["CI/CD", "CI\\s*/\\s*CD"],
  ["Jenkins", "Jenkins"], ["Git", "Git"], ["GitHub", "GitHub"], ["GitLab", "GitLab"], ["Bitbucket", "Bitbucket"], ["Agile", "Agile"], ["Scrum", "Scrum"],
  ["Kanban", "Kanban"], ["JIRA", "JIRA"], ["Confluence", "Confluence"], ["AWS", "AWS|Amazon\\s*Web\\s*Services"], ["Azure", "Azure"],
  ["GCP", "GCP|Google\\s*Cloud"], ["Oracle", "Oracle"], ["PostgreSQL", "PostgreSQL|Postgres"], ["MySQL", "MySQL"], ["SQL Server", "SQL\\s*Server|MSSQL"],
  ["Cassandra", "Cassandra"], ["JPA", "JPA"], ["JDBC", "JDBC"], ["JMS", "JMS"], ["RabbitMQ", "RabbitMQ"], ["ActiveMQ", "ActiveMQ"], ["IBM MQ", "IBM\\s*MQ|MQ\\s*Series"],
  ["SOAP", "SOAP"], ["Maven", "Maven"], ["Gradle", "Gradle"], ["npm", "npm"], ["Webpack", "Webpack"], ["HTML5", "HTML5?"], ["CSS3", "CSS3?"],
  ["Sass/SCSS", "Sass|SCSS"], ["JavaScript", "JavaScript|ES6"], ["jQuery", "jQuery"], ["Bootstrap", "Bootstrap"], ["Material UI", "Material\\s*UI|MUI"],
  ["Linux", "Linux"], ["Unix", "Unix"], ["Shell scripting", "Shell\\s*script(?:ing)?|Bash"], ["PowerShell", "PowerShell"], ["OAuth", "OAuth\\s*2?(?:\\.0)?"],
  ["JWT", "JWT"], ["SAML", "SAML"], ["SSO", "SSO|Single\\s*Sign[-\\s]On"], ["Okta", "Okta"], ["Spring Security", "Spring\\s*Security"],
  ["Spring MVC", "Spring\\s*MVC"], ["Spring Data", "Spring\\s*Data"], ["Spring Batch", "Spring\\s*Batch"], ["Splunk", "Splunk"],
  ["ELK", "ELK|Kibana|Logstash"], ["Datadog", "Datadog"], ["New Relic", "New\\s*Relic"], ["Dynatrace", "Dynatrace"], ["CloudWatch", "CloudWatch"],
  ["Selenium", "Selenium"], ["Cucumber", "Cucumber"], ["Mockito", "Mockito"], ["Jasmine", "Jasmine"], ["Karma", "Karma"], ["Mocha", "Mocha"],
  ["Postman", "Postman"], ["Swagger / OpenAPI", "Swagger|OpenAPI"], ["Tomcat", "Tomcat"], ["WebLogic", "WebLogic"], ["WebSphere", "WebSphere"],
  ["JBoss", "JBoss|WildFly"], ["Apache Camel", "Camel"], ["Express.js", "Express(?:\\.js)?"], ["Django", "Django"], ["Flask", "Flask"], ["FastAPI", "FastAPI"],
  ["C#", "C#"], ["Scala", "Scala"], ["Ruby", "Ruby"], ["PHP", "PHP"], ["Hadoop", "Hadoop"], ["Hive", "Hive"], ["EC2", "EC2"], ["S3", "S3"], ["RDS", "RDS"],
  ["SQS", "SQS"], ["SNS", "SNS"], ["IAM", "IAM"], ["OpenShift", "OpenShift"], ["PCF", "PCF|Pivotal\\s*Cloud\\s*Foundry"], ["SonarQube", "SonarQube"],
  ["Event-driven architecture", "Event[-\\s]driven"], ["Design patterns", "Design\\s*patterns?"], ["OOP", "OOP|OOAD|Object[-\\s]Oriented"],
  ["TDD", "TDD|Test[-\\s]Driven"], ["BDD", "BDD|Behaviou?r[-\\s]Driven"], ["Unit testing", "Unit\\s*test(?:s|ing)?"], ["Integration testing", "Integration\\s*test(?:s|ing)?"],
  ["System design", "System\\s*design"], ["Data structures", "Data\\s*structures?"], ["Multithreading", "Multi-?threading|Concurrency"],
  ["Performance tuning", "Performance\\s*tuning|Performance\\s*optimi[sz]ation"], ["Code reviews", "Code\\s*reviews?"], ["Mentoring", "Mentor(?:ing|ed)?"],
  ["Production support", "Production\\s*support|On[-\\s]call"], ["Banking", "Banking|Bank"], ["Capital markets", "Capital\\s*Markets|Trading|Securities"],
  ["Payments", "Payments?"], ["Healthcare", "Healthcare|HIPAA"], ["Insurance", "Insurance"], ["Retail", "Retail|E-?commerce"], ["PCI", "PCI(?:\\s*DSS)?"]
];

const DICT: [string, RegExp][] = [
  ...TECH.map((t) => [t.name, t.re] as [string, string]),
  ...EXTRA
].map(([label, re]) => [label, new RegExp(`(?<![\\w])(?:${re})(?![\\w])`, "i")] as [string, RegExp]);

export type JobMatch = { score: number; matched: string[]; missing: string[]; jdYears?: number; resumeYears?: number };

export function jobMatch(jd: string, d: ResumeData): JobMatch | null {
  if (!jd.trim()) return null;
  const resume = [d.title, ...d.summary, ...d.skills.map((s) => s.cat + " " + s.items),
    ...d.clients.flatMap((c) => [c.role, ...c.description, ...c.responsibilities, c.environment]), ...d.education].join(" \n ");
  const labels = new Set<string>();
  const matched: string[] = [], missing: string[] = [];
  for (const [label, re] of DICT) {
    if (labels.has(label) || !re.test(jd)) continue;
    labels.add(label);
    (re.test(resume) ? matched : missing).push(label);
  }
  // Drop generic parents when a more specific match exists (e.g. "Java" vs "Java 17" are one entry already).
  const total = matched.length + missing.length;
  const yrs = (s: string) => { const m = s.match(/(\d{1,2})\s*\+?\s*(?:years|yrs)/i); return m ? +m[1] : undefined; };
  return { score: total ? Math.round((matched.length / total) * 100) : 0, matched, missing, jdYears: yrs(jd), resumeYears: yrs([d.title, ...d.summary].join(" ")) };
}
