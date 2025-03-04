![Usage-Based Data Discovery Web App](https://github.com/ESIPFed/ubd-tool-remotedb/blob/main/static/ubd-app.png?raw=true)


## Setting up the Neptune graph database 

The easiest way to set up the Neptune graph is through with a pre-defined AWS CloudFormation Stack. Easy startup instructions 
can be found at https://docs.aws.amazon.com/neptune/latest/userguide/get-started-create-cluster.html.
The Region is very important:  make sure you are using a region where you have an Internet Gateway. 
Also, note that some regions require HTTPS (vs. HTTP). In any case, HTTPS is better practice.)
Once you decide on Region, make sure to create the EC2 key pair in that Region.

With Region in mind and Key Pair in hand, choose one of the Launch Stack buttons in the section 
"Using an AWS CloudFormation Stack to Create a Neptune DB Cluster".

__To Do:  Add where to find important values...__

At the end of this, you will have a Neptune DB Cluster and at least one DB Instance. 
You will also have an EC2 host through which to access the Neptune Database (it has no externally reachable endpoint). 

## Setting up to run the application components
The following instructions are verified for the EC2 host created by the Neptune stack.

SSH to the EC2 host (AWS Systems Manager Session Manager can be used in addition or as an alternative)

Run this locally: 
- Update/Upgrade your ec2 instance (differs based on OS)

For Ubuntu `sudo apt update`

For Ubuntu `sudo apt upgrade`

- Clone this repository. 

`$ cd` into the project directory. 

- Install Python virtual environments , if not already installed

`$ pip3 install virtualenv`

- Create a Python virtual environment with the command 

`$ python3 -m venv ./venv`. 

For simplicity, we name it 'venv'. 

- Start up the virtual environment using the following command 

`$ source venv/bin/activate`.

- Install the required python packages

`$ pip3 install -r requirements.txt`

## Loading the graph data

Loading the graph data is currently a two step process:
Parse the CSV file with the relationships, outputting a new CSV with additiona information and in the expected structure:

`$ python3 parse_csv.py -i <input_file> -o algo-output.csv`

Load the graph into the database

`$ python load_graph.py`

## Deploying the Web User Interface application

The Web Interface for Usage-based Discovery is written in Python Flask, and deployed using Zappa.

1. Load your AWS credentials into the environment (you'll need https://aws.amazon.com/cli/ for this)

`$ aws configure`

2. Initialize Zappa

`$ zappa init`

3. Modify the zappa_settings.json file

You will need to add the vpc_config section and environment_variables.
The Neptune environment variable can be obtained from the Neptune console:  click on the Neptune cluster name.
The value for NEPTUNEDBRO will be under the Connectivity & security tab in the Endpoints table. 
Choose the one where Type=Reader. (Note that the wss prefix indicates it is using secure web sockets.)
To get the subnet_ids, click the Subnet groups on the side panel of the Neptune cluster.

```json
{
    "dev": {
        "app_function": "app.app",
        "aws_region" : "us-west-1",
        "manage_roles" : true,
        "profile_name": null,
        "project_name": "ubd-tool",
        "runtime": "python3.7",
        "s3_bucket": "YOUR_S3_BUCKET",
        "vpc_config": {
                "SubnetIds": ["YOUR_SUBNET_ID1", "YOUR_SUBNET_ID2"] (make sure subnets are connected to NAT gateway),
                "SecurityGroupIds": [ "YOUR_SECURITY_GROUP_ID" ]
        },
        "environment_variables": {
                "NEPTUNEDBRO": "wss://<neptune endpoint>:<port>/gremlin", 
                "STAGE": "/[YOUR_STAGE_NAME(ex. DEV/PROD)]",
                "CLIENT_SECRET": "YOUR_CLIENT_SECRET_FOR_ORCID_OAUTH",
                "CLIENT_ID": "YOUR_CLIENT_ID_FOR_ORCID_OAUTH",
                "SECRET_KEY": "YOUR_SECRET_KEY_FOR_FLASK_SESSION",
                "S3_BUCKET": "YOUR_S3_BUCKET"
        }
    }
}
```

4. To deploy, now type:

`$ zappa deploy dev`

This will create a lambda function with the code from app.py and instantiate an API gateway. 
Screenshots will go into the S3 bucket listed in the config file.

__(Q:  does bucket need to be pre-created? Need to find out...)__

## To run the application in local developer mode

Load the graph database as described above, but rather than loading the data into an AWS Neptune cluster, load it into a local Gremlin DB. Instructions for Gremlin installation can be found at https://tinkerpop.apache.org/gremlin.html or you can run a Gremlin server in a container using Docker (https://hub.docker.com/r/tinkerpop/gremlin-server/). 

When running the DB locally, configure your DB url environment variable like this: `"NEPTUNEDBRO": "ws://localhost:8182/gremlin"`. If using Docker, be sure to expose port 8182 of the gremlin server to your local machine using the -p command (e.g.: `docker run -p 8182:8182 my-gremlin-server-image`).

`$ python3 app.py`

Browse to http://localhost:5000

## Security

Install git-secrets on your machine to prevent yourself from accidentally committing sensitive info (like access keys, secrets) to your GitHub repo:

https://github.com/awslabs/git-secrets

Use Python Safety (https://github.com/pyupio/safety) to check your installed dependencies for known security vulnerabilities:

`$ safety check -r requirements.txt`

Use Python Bandit (https://github.com/PyCQA/bandit) to find common security issues in your Python code:

`$ bandit -r ~/your_repos/project`

**Snyk** is used as a blocking step to check dependencies for vulnerabilities when deploying to any environment.

## Contributing

Any questions or suggestions for improvement?
- Create an issue, and use the templates for feature request or bug reports for improvements
- Questions - email chris.lynnes@nasa.gov 

If looking to contribute, please look at [CONTRIBUTING.md](CONTRIBUTING.md).

