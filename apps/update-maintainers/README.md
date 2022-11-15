# update-maintainers

- [Setup](#setup)
- [Usage](#usage)
  - [High level](#high-level)
- [Future features](#future-features)
  - [Nice to have but probably won't add](#nice-to-have-but-probably-wont-add)

Create pull requests to update ROS 2 repository maintainers.

This code relies on two files, which are combined to update repository maintainers.

- A maintainers assignment YAML file ([for example](./data/2022-11-04-maintainer-assignments.yaml)) that contains information about a repository and lists its maintainers Github usernames.

- A file with maintainers information ([for example](./data/2022-11-04-maintainers-info.yaml)) that contains information about each maintainer.

The following files are created or modified:

- `CODEOWNERS`: This file is created in the top directory.
  Currently, if this file exists, nothing is done.
- `package.xml`: New maintainers are added, old maintainers are moved to authors.
  Authors and maintainers are sorted alphabetically.
- `setup.py`: `maintainer` and `maintainer_email` fields are updated.
  Maintainers are sorted alphabetically.

## Setup

1. Add your Github token to the environment variable `GITHUB_TOKEN`.
   You can do this by copying the `.env.example` file at the root of the repository to `.env` and adding your token to the file.
   Your token should have write access to the repositories you want to update and the ability to create pull requests.
2. You'll need write access to the repos you want to modify (currently, doesn't automatically create a fork, although you can manually create a fork once changes have been made by the program).

## Usage

### High level

1. Create the required files from a maintainer assignment CSV file.
   To do this, you can use the [`process-maintainers-assignment-csv.ts`](./scripts/process-maintainers-assignment-csv.ts) script.
   You'll have to modify the script to point to the correct files.
   Note that you can reference a previous maintainer's info file to populate available information about maintainers.
2. Run the update script: [`update-maintainers-for-all-repositories.ts`](./scripts/update-maintainers-for-all-repositories.ts).
   You'll have to modify the script to point to the correct files.

   This script will create a pull request for each repository that needs to be updated.
   In dry run, the script will modify files and create commits, but will not push those changes or create pull requests.

   You can run this script multiple times, and it will only create pull requests for repositories that have not been updated yet.

   This script will also output a list of all the repositories that failed to update (usually because of inconsistencies, such as having no authors listed).
   You can then manually update those repositories.
3. You can use the [`update-maintainers-for-one-repository.ts`](./scripts/update-maintainers-for-one-repository.ts) script to update individual repositories.
   My (@audrow) suggestion is to use VS Code and create a breakpoint in [`update-repository-maintainers.ts`](./src/update-repository-maintainers.ts).
   When you hit the breakpoint, you can use a terminal to go to the repository and change the files in question.
   Once you are satisfied with the changes, you can continue the script to create a pull request.

## Future features

- Update `CODEOWNERS` files.
  Currently, I wanted to avoid clobbering existing `CODEOWNERS` files, but it would be nice to have a way to update them.
- Expose options via a CLI.
  Currently, you have to modify the scripts to change options.
  This was faster to implement, but will be harder for people who are less familiar with Typescript to use.
- Automatically create forks if the user doesn't have write access to the repository.
  This isn't particularly hard, it just requires work, so I haven't done it yet.

### Nice to have but probably won't add
- Handle the case where there is no `author` tag in a `package.xml` file.
  Currently, I use REGEX to find the author tag, and if there is no author tag, the script fails.
  This is probably not worth fixing since once it is fixed, there should be very few new exceptions.
- Run schema validation on the files modified.
- Add authors to `setup.py` files.
  Although it's unclear how we'll use `setup.py` files with newer versions of Python, since they've moved to something else.

