import * as cdk from "@aws-cdk/core";
// import * as lambda from "@aws-cdk/aws-lambda";
import { Function, Code, Runtime, LayerVersion } from '@aws-cdk/aws-lambda';
// import * as dynamodb from "@aws-cdk/aws-dynamodb";
import { Table, AttributeType, BillingMode } from '@aws-cdk/aws-dynamodb';
// import * as apigw from "@aws-cdk/aws-apigateway";
import {
  RestApi,
  LambdaIntegration,
} from '@aws-cdk/aws-apigateway';
import { resolve } from "path";

export class CdkServerlessGetStartedStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Dynamodb table definition
    // const table = new Table(this, "Hello", {
    //   partitionKey: { name: "name", type: AttributeType.STRING },
    // });
    const table = new Table(this, 'Table', {
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    
    // grant api handler to read and write data to and from above table
    

    // lambda layer
    const lambdaLayer = new LayerVersion(this, 'HandlerLayer',{
      // code: Code.fromAsset(resolve(__dirname,'../api/node_modules')),
      // code: Code.fromAsset(resolve(__dirname,'../api/nodejs')),
      code: Code.fromAsset(resolve(__dirname,'../api/node-modules-layer')),
      compatibleRuntimes: [Runtime.NODEJS_12_X, Runtime.NODEJS_10_X],
      description: 'Api Handler Dependencies',
    })
    // lambda function
    // const dynamoLambda = new Function(this, "DynamoLambdaHandler", {
    //   runtime: Runtime.NODEJS_12_X,
    //   code: Code.asset("functions"),
    //   handler: "function.handler",
    //   environment: {
    //     HELLO_TABLE_NAME: table.tableName,
    //   },
    // });

    const handler = new Function(this, "Handler", {
      runtime: Runtime.NODEJS_12_X,
      code: Code.fromAsset(resolve(__dirname,'../api/dist'),{
        exclude:['node_modules'],
      }),
      handler: "main.api",
      layers:[lambdaLayer],
      environment: {
        // HELLO_TABLE_NAME: table.tableName,
        tableName: table.tableName,
      },
    });
    

    // permissions to lambda to dynamo table
    table.grantReadWriteData(handler);

    // create the API Gateway with one method and path
    const api = new RestApi(this, "hello-api");

    api.root
      .resourceForPath("hello")
      .addMethod("GET", new LambdaIntegration(handler));

    new cdk.CfnOutput(this, "HTTP API URL", {
      value: api.url ?? "Something went wrong with the deploy",
    });
  }
}