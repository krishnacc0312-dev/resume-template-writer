// Example resume used for thumbnails and sample previews. Fictional person and clients.
import type { ResumeData } from "./types";

export const SAMPLE: ResumeData = {
  name: "Alex Morgan",
  title: "Senior Full Stack Developer",
  contact: ["Dallas, TX", "(555) 010-2233", "alex.morgan@email.com", "linkedin.com/in/alexmorgan"],
  summary: [
    "Senior Full Stack Developer with 11 years of experience building secure, high-traffic web applications for banking, healthcare and retail clients.",
    "Expert in Java 17, Spring Boot and microservices, with event-driven integrations using Apache Kafka and REST/GraphQL APIs.",
    "Builds responsive single-page applications with React, Angular and TypeScript, backed by reusable component libraries.",
    "Deploys to AWS (EKS, Lambda, RDS, S3) and Azure using Docker, Kubernetes and Terraform through Jenkins and GitHub Actions pipelines.",
    "Strong in SQL and NoSQL design and tuning across PostgreSQL, Oracle, MongoDB and Redis.",
    "Leads code reviews, mentors developers and works closely with product owners in Agile/Scrum teams."
  ],
  skills: [
    { cat: "Languages", items: "Java 8/11/17, JavaScript, TypeScript, Python, SQL" },
    { cat: "Frontend", items: "React, Angular, Redux, NgRx, HTML5, CSS3, Material UI" },
    { cat: "Backend", items: "Spring Boot, Spring Cloud, Spring Security, Hibernate, Node.js, Express, GraphQL" },
    { cat: "Cloud & DevOps", items: "AWS (EKS, Lambda, RDS, S3, SQS), Azure, Docker, Kubernetes, Terraform, Jenkins, GitHub Actions" },
    { cat: "Messaging", items: "Apache Kafka, RabbitMQ, JMS" },
    { cat: "Databases", items: "PostgreSQL, Oracle, MongoDB, Redis, DynamoDB" },
    { cat: "Testing & Tools", items: "JUnit 5, Mockito, Jest, Cypress, SonarQube, Splunk, JIRA, Git" }
  ],
  clients: [
    { client: "Northwind Financial", location: "Dallas, TX", role: "Senior Full Stack Developer", dates: "Jan 2022 – Present", description: [],
      responsibilities: [
        "Lead development of a customer self-service lending portal used by more than 2 million customers each month.",
        "Designed Spring Boot microservices on AWS EKS for loan origination, cutting average API response time by 40%.",
        "Built React and TypeScript front-end modules with a shared component library adopted by four teams.",
        "Moved loan status updates to Kafka event streaming so servicing, risk and reporting systems use the same events.",
        "Set up GitHub Actions and Terraform pipelines with automated tests, reducing release time from days to hours.",
        "Mentor five developers and run weekly code reviews focused on security and performance."
      ],
      environment: "Java 17, Spring Boot, React, TypeScript, Kafka, AWS (EKS, RDS, S3), Terraform, PostgreSQL, GitHub Actions" },
    { client: "Contoso Health", location: "Chicago, IL", role: "Full Stack Developer", dates: "Mar 2019 – Dec 2021", description: [],
      responsibilities: [
        "Developed Angular dashboards and Spring Boot APIs for patient scheduling across 120 clinics.",
        "Integrated claims data from legacy SOAP services through new RESTful APIs and an API gateway.",
        "Improved slow Oracle queries and indexes, cutting nightly batch time by 55%.",
        "Containerized services with Docker and deployed them to Azure Kubernetes Service.",
        "Wrote JUnit, Mockito and Jest tests, keeping coverage above 85% on all new code."
      ],
      environment: "Java 11, Spring Boot, Angular, Oracle, Docker, Azure (AKS), Jenkins, JUnit, Mockito" },
    { client: "Fabrikam Retail", location: "Austin, TX", role: "Java Developer", dates: "Jun 2015 – Feb 2019", description: [],
      responsibilities: [
        "Built order management and inventory services with Spring MVC and Hibernate for 300 stores.",
        "Created reusable UI components with AngularJS, HTML5 and CSS3 for the store associate portal.",
        "Developed batch jobs with Spring Batch to reconcile daily sales and inventory data.",
        "Supported production releases and resolved issues as part of a weekly on-call rotation."
      ],
      environment: "Java 8, Spring MVC, Hibernate, AngularJS, MySQL, Tomcat, Jenkins, SVN" }
  ],
  education: ["Master of Science in Computer Science, University of Texas at Dallas, 2015"]
};
