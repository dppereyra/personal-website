# SonarQube Setup Instructions

This project is configured to run SonarQube analysis as part of the CI pipeline.

## Required GitHub Secrets

To enable SonarQube analysis, you need to add the following secrets to your GitHub repository:

### 1. `SONAR_TOKEN`

This is your SonarQube authentication token.

**To create the token:**
1. Log in to your SonarQube instance
2. Go to **User > My Account > Security**
3. Generate a new token
4. Copy the token value

**To add to GitHub:**
1. Go to your repository on GitHub
2. Navigate to **Settings > Secrets and variables > Actions**
3. Click **New repository secret**
4. Name: `SONAR_TOKEN`
5. Value: Paste your SonarQube token
6. Click **Add secret**

### 2. `SONAR_HOST_URL`

This is the URL of your SonarQube server.

**Examples:**
- SonarCloud: `https://sonarcloud.io`
- Self-hosted: `https://sonarqube.yourdomain.com`

**To add to GitHub:**
1. Go to **Settings > Secrets and variables > Actions**
2. Click **New repository secret**
3. Name: `SONAR_HOST_URL`
4. Value: Your SonarQube server URL
5. Click **Add secret**

## SonarQube Project Setup

### Using SonarCloud

1. Go to [SonarCloud.io](https://sonarcloud.io)
2. Sign in with your GitHub account
3. Click **+** > **Analyze new project**
4. Select your repository
5. Follow the setup wizard
6. Use the project key: `dppereyra_personal-website`

### Using Self-Hosted SonarQube

1. Log in to your SonarQube instance
2. Click **Create Project**
3. Choose **Manually**
4. Project key: `dppereyra_personal-website`
5. Display name: `Personal Website`
6. Click **Set Up**
7. Choose **With GitHub Actions**
8. Follow the instructions to generate a token

## Configuration Files

The project includes:
- `.github/workflows/ci.yml` - CI pipeline with SonarQube integration
- `sonar-project.properties` - SonarQube analysis configuration

## What Gets Analyzed

- **Source code:** All TypeScript, JavaScript, and Svelte files in `src/`
- **Test coverage:** Coverage reports from Vitest
- **Code quality:** Code smells, bugs, vulnerabilities, security hotspots
- **Test files:** Properly excluded from coverage calculations

## Viewing Results

After the CI pipeline runs:
1. Go to your SonarQube instance
2. Navigate to your project
3. View metrics for:
   - Bugs
   - Vulnerabilities
   - Code Smells
   - Coverage
   - Duplications
   - Security Hotspots

## Quality Gate

The pipeline includes a quality gate check that will:
- Pass/fail based on your SonarQube quality gate settings
- Currently set to `continue-on-error: true` (won't fail the build)
- Can be changed to enforce quality standards by removing `continue-on-error`

## Troubleshooting

### Analysis not running?
- Check that both secrets are set correctly
- Verify the SonarQube project key matches `sonar-project.properties`
- Check GitHub Actions logs for error messages

### Coverage not showing?
- Ensure tests are running successfully in CI
- Verify `coverage/lcov.info` is being generated
- Check that coverage artifacts are being uploaded/downloaded

### Quality gate always passing/failing?
- Review quality gate settings in SonarQube
- Adjust thresholds as needed for your project
- Consider project size and maturity when setting standards
