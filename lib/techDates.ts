// Release (general availability) dates of common technologies, "YYYY-MM".
// Used to flag a technology that appears under a client which ended before it was released.
// Where a product had a public preview long before GA, the earlier date is used, so flags stay conservative.
// Unversioned names use the first release, so they never flag older, legitimate use.

export type Tech = {
  name: string;
  /** Regular expression source for the name (case-insensitive, word-bounded by the matcher). */
  re: string;
  /** Release of the product itself (used when no version is written). */
  ga: string;
  /** Release of specific versions, e.g. { "17": "2021-09" }. */
  versions?: Record<string, string>;
  /** Java-style "1.8" means 8. */
  oneDot?: boolean;
};

const range = (pairs: [string, string][]) => Object.fromEntries(pairs);

export const TECH: Tech[] = [
  // Languages and runtimes
  { name: "Java", re: "Java(?!\\s*Script|Script)|JDK|Java\\s*SE", ga: "1996-01", oneDot: true, versions: range([
    ["5", "2004-09"], ["6", "2006-12"], ["7", "2011-07"], ["8", "2014-03"], ["9", "2017-09"], ["10", "2018-03"], ["11", "2018-09"],
    ["12", "2019-03"], ["13", "2019-09"], ["14", "2020-03"], ["15", "2020-09"], ["16", "2021-03"], ["17", "2021-09"], ["18", "2022-03"],
    ["19", "2022-09"], ["20", "2023-03"], ["21", "2023-09"], ["22", "2024-03"], ["23", "2024-09"], ["24", "2025-03"], ["25", "2025-09"]]) },
  { name: "TypeScript", re: "TypeScript", ga: "2012-10", versions: range([["2", "2016-09"], ["3", "2018-07"], ["4", "2020-08"], ["5", "2023-03"]]) },
  { name: "Node.js", re: "Node\\.?js|NodeJS", ga: "2009-05", versions: range([
    ["10", "2018-04"], ["12", "2019-04"], ["14", "2020-04"], ["16", "2021-04"], ["18", "2022-04"], ["20", "2023-04"], ["22", "2024-04"]]) },
  { name: "Python", re: "Python", ga: "1991-02", versions: range([
    ["3", "2008-12"], ["3.6", "2016-12"], ["3.7", "2018-06"], ["3.8", "2019-10"], ["3.9", "2020-10"], ["3.10", "2021-10"],
    ["3.11", "2022-10"], ["3.12", "2023-10"], ["3.13", "2024-10"]]) },
  { name: "Kotlin", re: "Kotlin", ga: "2016-02" },
  { name: "Go", re: "Golang", ga: "2012-03" },
  { name: "Rust", re: "Rust", ga: "2015-05" },
  { name: "SwiftUI", re: "SwiftUI", ga: "2019-09" },
  { name: "Deno", re: "Deno", ga: "2020-05" },
  { name: "Bun", re: "Bun\\.?js|Bun runtime", ga: "2023-09" },
  { name: ".NET Core", re: "\\.NET\\s*Core", ga: "2016-06" },
  { name: ".NET", re: "\\.NET(?!\\s*Core|\\s*Framework)", ga: "2002-02", versions: range([["5", "2020-11"], ["6", "2021-11"], ["7", "2022-11"], ["8", "2023-11"], ["9", "2024-11"]]) },
  { name: "Blazor", re: "Blazor", ga: "2020-05" },
  // Java frameworks
  { name: "Spring Boot", re: "Spring\\s*Boot", ga: "2014-04", versions: range([["1", "2014-04"], ["2", "2018-03"], ["3", "2022-11"]]) },
  { name: "Spring Framework", re: "Spring(?:\\s*Framework)?(?!\\s*(?:Boot|Cloud|Security|Batch|Data|MVC|Integration|WebFlux|AOP|Core|IOC|IoC|JDBC|Kafka|AI|REST|Web))", ga: "2004-03",
    versions: range([["4", "2013-12"], ["5", "2017-09"], ["6", "2022-11"]]) },
  { name: "Spring Cloud", re: "Spring\\s*Cloud", ga: "2015-03" },
  { name: "Spring WebFlux", re: "Spring\\s*WebFlux|WebFlux", ga: "2017-09" },
  { name: "Spring AI", re: "Spring\\s*AI", ga: "2024-05" },
  { name: "Hibernate", re: "Hibernate", ga: "2001-05", versions: range([["5", "2015-08"], ["6", "2022-03"]]) },
  { name: "Jakarta EE", re: "Jakarta\\s*EE", ga: "2019-09" },
  { name: "Quarkus", re: "Quarkus", ga: "2019-03" },
  { name: "Micronaut", re: "Micronaut", ga: "2018-10" },
  { name: "JUnit", re: "JUnit", ga: "2002-01", versions: range([["4", "2006-02"], ["5", "2017-09"]]) },
  // Front end
  { name: "AngularJS", re: "Angular\\s*JS|AngularJS|Angular\\.js", ga: "2010-10" },
  { name: "Angular", re: "Angular(?!\\s*JS|JS|\\.js)", ga: "2010-10", versions: range([
    ["2", "2016-09"], ["4", "2017-03"], ["5", "2017-11"], ["6", "2018-05"], ["7", "2018-10"], ["8", "2019-05"], ["9", "2020-02"],
    ["10", "2020-06"], ["11", "2020-11"], ["12", "2021-05"], ["13", "2021-11"], ["14", "2022-06"], ["15", "2022-11"], ["16", "2023-05"],
    ["17", "2023-11"], ["18", "2024-05"], ["19", "2024-11"], ["20", "2025-05"]]) },
  { name: "React", re: "React(?:\\.?js|JS)?(?!\\s*Native)", ga: "2013-05", versions: range([["15", "2016-04"], ["16", "2017-09"], ["17", "2020-10"], ["18", "2022-03"], ["19", "2024-12"]]) },
  { name: "React Hooks", re: "React\\s*Hooks", ga: "2019-02" },
  { name: "React Native", re: "React\\s*Native", ga: "2015-03" },
  { name: "Next.js", re: "Next\\.?js", ga: "2016-10", versions: range([["13", "2022-10"], ["14", "2023-10"], ["15", "2024-10"]]) },
  { name: "Vue.js", re: "Vue(?:\\.?js)?", ga: "2014-02", versions: range([["2", "2016-09"], ["3", "2020-09"]]) },
  { name: "Svelte", re: "Svelte", ga: "2016-11" },
  { name: "Redux", re: "Redux(?!\\s*Toolkit)", ga: "2015-06" },
  { name: "Redux Toolkit", re: "Redux\\s*Toolkit|RTK", ga: "2019-10" },
  { name: "NgRx", re: "NgRx", ga: "2016-05" },
  { name: "Vite", re: "Vite", ga: "2020-04" },
  { name: "Tailwind CSS", re: "Tailwind(?:\\s*CSS)?", ga: "2017-11" },
  { name: "Flutter", re: "Flutter", ga: "2018-12" },
  { name: "GraphQL", re: "GraphQL", ga: "2015-09" },
  { name: "gRPC", re: "gRPC", ga: "2016-08" },
  { name: "NestJS", re: "NestJS|Nest\\.js", ga: "2017-05" },
  { name: "Jest", re: "Jest", ga: "2014-05" },
  { name: "Cypress", re: "Cypress", ga: "2017-10" },
  { name: "Playwright", re: "Playwright", ga: "2020-01" },
  { name: "VS Code", re: "VS\\s*Code|Visual\\s*Studio\\s*Code", ga: "2015-04" },
  // Containers, DevOps, observability
  { name: "Docker", re: "Docker", ga: "2013-03" },
  { name: "Kubernetes", re: "Kubernetes|K8s", ga: "2015-07" },
  { name: "Helm", re: "Helm", ga: "2016-02" },
  { name: "Istio", re: "Istio", ga: "2017-05" },
  { name: "Terraform", re: "Terraform", ga: "2014-07" },
  { name: "Pulumi", re: "Pulumi", ga: "2018-06" },
  { name: "Ansible", re: "Ansible", ga: "2012-02" },
  { name: "Argo CD", re: "Argo\\s*CD", ga: "2018-03" },
  { name: "GitHub Actions", re: "GitHub\\s*Actions", ga: "2018-10" },
  { name: "Prometheus", re: "Prometheus", ga: "2015-01" },
  { name: "Grafana", re: "Grafana", ga: "2014-01" },
  { name: "OpenTelemetry", re: "OpenTelemetry", ga: "2019-05" },
  // Data and messaging
  { name: "Kafka", re: "Kafka(?!\\s*Streams)", ga: "2011-01" },
  { name: "Kafka Streams", re: "Kafka\\s*Streams", ga: "2016-05" },
  { name: "Apache Spark", re: "Apache\\s*Spark|Spark(?=\\s*(?:Streaming|SQL|jobs?|cluster))", ga: "2010-03" },
  { name: "Apache Flink", re: "Flink", ga: "2014-08" },
  { name: "Apache Beam", re: "Apache\\s*Beam", ga: "2016-02" },
  { name: "Apache Airflow", re: "Airflow", ga: "2015-06" },
  { name: "Snowflake", re: "Snowflake", ga: "2014-10" },
  { name: "Elasticsearch", re: "Elasticsearch|Elastic\\s*Search", ga: "2010-02" },
  { name: "MongoDB", re: "MongoDB|Mongo\\s*DB", ga: "2009-02" },
  { name: "Redis", re: "Redis", ga: "2009-05" },
  // AWS
  { name: "AWS Lambda", re: "AWS\\s*Lambda|Lambda(?!\\s*(?:expressions?|functions? in Java|calculus))", ga: "2014-11" },
  { name: "Amazon ECS", re: "ECS", ga: "2014-11" },
  { name: "Amazon EKS", re: "EKS", ga: "2018-06" },
  { name: "AWS Fargate", re: "Fargate", ga: "2017-11" },
  { name: "Amazon Aurora", re: "Aurora", ga: "2014-11" },
  { name: "DynamoDB", re: "DynamoDB|Dynamo\\s*DB", ga: "2012-01" },
  { name: "API Gateway", re: "API\\s*Gateway", ga: "2015-07" },
  { name: "AWS Step Functions", re: "Step\\s*Functions", ga: "2016-12" },
  { name: "Amazon Kinesis", re: "Kinesis", ga: "2013-11" },
  { name: "AWS CDK", re: "AWS\\s*CDK|\\bCDK\\b", ga: "2019-07" },
  { name: "Amazon SageMaker", re: "SageMaker", ga: "2017-11" },
  { name: "Amazon Bedrock", re: "Bedrock", ga: "2023-04" },
  { name: "AWS AppSync", re: "AppSync", ga: "2017-11" },
  { name: "Amazon Cognito", re: "Cognito", ga: "2014-07" },
  { name: "Amazon EventBridge", re: "EventBridge", ga: "2019-07" },
  { name: "AWS Amplify", re: "AWS\\s*Amplify|Amplify\\s*(?:Console|Studio|Hosting)", ga: "2017-11" },
  { name: "AWS Glue", re: "AWS\\s*Glue", ga: "2017-08" },
  { name: "Amazon Athena", re: "Athena", ga: "2016-11" },
  { name: "Amazon Redshift", re: "Redshift", ga: "2012-11" },
  // Azure and Google Cloud
  { name: "Azure Kubernetes Service", re: "AKS|Azure\\s*Kubernetes", ga: "2017-10" },
  { name: "Azure Functions", re: "Azure\\s*Functions", ga: "2016-03" },
  { name: "Azure Cosmos DB", re: "Cosmos\\s*DB", ga: "2017-05" },
  { name: "Azure DevOps", re: "Azure\\s*DevOps", ga: "2018-09" },
  { name: "Google Kubernetes Engine", re: "GKE|Google\\s*Kubernetes\\s*Engine", ga: "2014-11" },
  { name: "Google Cloud Run", re: "Cloud\\s*Run", ga: "2019-04" },
  { name: "BigQuery", re: "BigQuery", ga: "2010-05" },
  // AI tools
  { name: "GitHub Copilot", re: "Copilot", ga: "2021-06" },
  { name: "ChatGPT", re: "ChatGPT", ga: "2022-11" },
  { name: "OpenAI API", re: "OpenAI(?!\\s*Codex)", ga: "2020-06" },
  { name: "OpenAI Codex", re: "OpenAI\\s*Codex|Codex", ga: "2021-08" },
  { name: "GPT-4", re: "GPT-?4", ga: "2023-03" },
  { name: "Claude", re: "Claude(?!\\s*Code)", ga: "2023-03" },
  { name: "Claude Code", re: "Claude\\s*Code", ga: "2025-02" },
  { name: "Google Gemini", re: "Gemini", ga: "2023-12" },
  { name: "LangChain", re: "LangChain", ga: "2022-10" },
  { name: "LlamaIndex", re: "LlamaIndex", ga: "2022-11" },
  { name: "Model Context Protocol", re: "MCP\\s*server|Model\\s*Context\\s*Protocol", ga: "2024-11" },
  { name: "RAG", re: "RAG|Retrieval[-\\s]Augmented", ga: "2020-05" }
];

export const monthIndex = (ym: string) => { const [y, m] = ym.split("-").map(Number); return y * 12 + (m - 1); };
export const fmtYM = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1] + " " + y;
};
