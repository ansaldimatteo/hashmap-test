<h1 align="center"><project-name>Hashmap</h1>

<p align="center"><project-description>Simple hashmap api</p>

## Built With

- Node 14.18.3


## Using the API

Please check `hashmap-openapi3.yml` in the project directory for a description of the different API calls.

In the project directory, you can run:

### `npm start`

Interact with the API at http://localhost:3000.
All calls except for the `/signup` and `/signin` require an `Authorization` header with `Bearer <jwt>`, which is provided with the `/signin` API call.

The API lets users save, update, view and delete string values from a hashmap. Admin users can also view a list of the users, and view and delete values from other user's hashmaps.

The data is stored persistantly in a relational database using `sqlite3`.

The database has 3 tables:
* hashmap_table, with the current status of the hashmaps
* users, with the list of users for the service
* userlogs, with a list of all the API calls + parameters the users have used. By querying this data, we can extract all the different interactions specific users have had with the service, for example all the keys they have deleted.



