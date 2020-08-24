# Semantic Enirichment of Enterprise Data (SEED)

The main goals of this thesis are:

- The import of semantic data into a SAP HANA database. If possible, the HANA Graph Engine (also called AIS) should be used to store the data in HANA.

- Once the semantic data is imported an API to semantically enrich data should be designed and implemented. It should be possible to query for an entity via its Uniform resource identifier (URI), get information on what kind of data is available for an entity and to finally retrieve a selected amount of this data.

- A method to disambiguate entities is needed to return the most appropriate entities with a ranking if the specific URI is unknown. Therefore the development of an algorithm and API to return the most likely entity associated with a search query is essential. 
This API will then be leveraged to provide entity propositions for the semantic enrichment. For semantic schema matching (using already described algorithms5) the same API can be used with the addition that it has to return the types which belong to the most appropriate entities. The word type here refers to a general term or category which describes a set of entities.

## Active Information Store (AIS)
AIS is a graph engine on top of HANA and provides the possibility to store and query graphs. The data manipulation and query language of AIS is Weakly-structured Information Processing and Exploration language (WIPE). It is based on the key paradigms of the AIS graph data model which consists of “entities and associations with unique identity and flexible sets of attributes”. Other popular languages like SPARQL Protocol and RDF Query Language (SPARQL) are based on subject-predicate-object statements (triples) and limit the possible contribution of new ideas and use cases for AIS.

AIS itself currently has some problems which lead to the decision of not using it further for the work described in this thesis. Instead, simple column store tables in HANA will be used. The following problems were identified:

• The number of columns for a table in HANA is currently limited to 1000. Although there are ways to increase this limitation (by using schema flexibility), it is not possible to import a table with over 1000 columns. For example, DBpedia 3.8 works while DBpedia 3.9 (more than 1300 columns would be needed) fails due to the limited amount of columns.

• WIPE currently can not deal with IRIs. This can lead to problems since it is technically possible to import Info Items with IRIs, but they can not be queried with WIPE.

• Performance of WIPE statements: after basic testing the overall performance was observed to be too slow and the AIS developer team was informed. As of yet, there is no solution to this problem.

## Architecture

The importer takes Dbpedia datasets (preferreably `.ttl ` files in Turtle RDF) and processes them into importable CSV files. These files, after being copied to the HANA instance, can be imported.
The daily update service runs as a cron job on the HANA instance and is executed once per day. If it finds a delta which has not yet been imported it will download it, unpack it and insert / delete the changed triples via the `hdbsql`  command. You can read more about the daily updater in the next chapter.
On the HANA server there are several `XSJS / XSJSLib`  files which provide the API below. These XSJS files interact via plain SQL queries with the HANA DB. 
The prototype to test the API is using the SAPUI5 library. Currently it links to a SAPUI5 library on another server in the intranet – to be more reliable, the SAPUI5 library should be placed directly on the server. The SAPUI5 prototype sends HTTP GET / POST requests to the XSJS API. The data is returned as JSON.

## Tables Structure

- **ABSTRACTS**: Hosts the extended abstracts set – the abstract column has a fuzzy search index.
- **TYPES**: Currently used for entity disambiguation. The column URI has a fuzzy search index, the column incomingno contains the number of incoming associations and the column order contains a number indicating how specific the type is (smaller means more specific).
- **RAW**: Contains properties and associations from the raw extracted data – at least the raw properties are more extensive, the raw associations are more extensive for some entities (Apple_Inc.) and less extensive for others (Apple). Right now **RAWPROPERTIES** and **ASSOCIATIONS** are used.
- **DISAMBIGUATIONS**: Currently not used. Reflects the hand-made disambiguation pages from Wikipedia.
- **CATEGORIES** and **CATEGSKOS**: Currently not used. The categories from the Wikipedia articles and their hierarchy. Could be very useful for entity disambiguation (if AIS gets fixed). In CATEGSKOS there are triples which indicate what the broader category of a category is. The categories in CATEGORIES are far more specific than the ones in TYPES.

## The Implementation of the XSJS API

There are four different `xsjs` files in this project:

- `disambiguate.xsjs`  Get most appropriate entities / categories for a searchword
- `describe.xsjs`  Load the properties which are available for an entity
- `enrich.xsjs`  Actually retrieve the data, filtering is possible
- `tableMatch.xsjs`  Match two tables by sending their cell values

The `disambiguate.xsjs`  and `tableMatch.xsjs`  use the file `DbpediaLib.xsjslib`  – it is a XSJS Library. You can import it with this code:

`$.import("harubixMatch.WebContent","DBpediaLib");` 

This library contains the core functionalities of SEED. You can use the functions in this library to build your own API extension. Just add another XSJS file, import with the command above, and you can use one of those functions:

`$.harubixMatch.WebContent.DbpediaLib.queryEntitiesWithTypes(query,fuzzyStr, limit)` 

This will query for a searchword in the `TYPES`  table. It returns a JSON object. More specific, it will return an array containing all found entities (called `entities`). For each element of entities the text search score (“txtScore”) and the number of incoming associations (`incomingNo`) is returned, as well as an array of the associated types (`types`). Each element in types has a name and an order. Each element of entities also has a “finalScore”, but this is set to zero and will be calculated in the method `getEntitiesWithTypes`

Generally, you should not use this method at all, as it is a helper method for `getEntitiesWithTypes`

`$.harubixMatch.WebContent.DbpediaLib.getEntitiesWithTypes(query, limit, incomingNoWeight, fuzzy, multilang)` 

This method can be used externally. First of all it processes the fuzzy parameter (which should be double) into a string. Here `textSearch=compare`  is added for all queries except for the `INTERLANGUAGE`  table. This is done to achieve similar text search scores for both search with and without fuzzy. The `INTERLANGUAGE`  table currently does not support ` textSearch=compare`  because of its column type (has to be `SHORTTEXT`  or `TEXT`  for that)

If `multilang`  is set to true, the `INTERLANGUAGE`  table is searched (fuzzy, if specified). The top rated result is then used for further processing (replaces the query parameter).

Then the queryEntitiesWithTypes method is called. If it returns no results, the `RAWPROPERTIES`  are searched (example: “`AAPL`”). The top rated result will replace query parameter and once again `queryEntitiesWithTypes`  is called.

Afterwards, the biggest number of incoming associations is determined from the returned “`ratingArray`”. The finalScore is calculated and saved, the ratingArray is sorted by that finalScore. The finalScore is currently calculated like this:

`$.harubixMatch.WebContent.DBpediaLib.getEntityTypeWithContext(query,context,limit)` 

This returns one entity which fits most likely in the context given (JSON object). For each entity in the context the method `getCategories`  is called. From this collection of types, a type vector is created – a list of types, and if a type occurs more than once, its score is added to the existing entry. Then the list is sorted by score. 

Then the possible entities for the query are retrieved by calling `getEntityWithTypes` . Now the types of the entities are compared (helper method `compareQueryWithContext` ) to the created type vector, starting with the most likely entity and the highest rated score. As soon as there is a match, the corresponding entity / type is returned.

`$.harubixMatch.WebContent.DBpediaLib.getEntities(query, limit, incomingNoWeight, fuzzy, multilang, verbose)` 

Just a small method to only return entities and no types.

`$.harubixMatch.WebContent.DBpediaLib.getCategories(query, limit, incomingNoWeight, orderWeight, fuzzy, multilang, verbose)` 

Here, only categories are returned. The order of the categories is determined by the `finalScore`  of the entity they belong to and their order. The higher the order, the less specific the category is. The parameter orderWeight influences how much is subtracted from the `finalScore`  in case the value of order exceeds 1.

Table match for example uses this function for every cell value:

`$.harubixMatch.WebContent.DBpediaLib.getCategories(tables[i].getColumn(j).getCell(k).getValue(),
20, 0.15, 0.1, fuzzy, multilang, false);` 

#### Mapping-based Properties & Associations vs. Raw Properties & Raw Associations

DBpedia offers mapped properties – usually some properties are missing here (since they are not mapped). The prototype currently relies on the `RAWPROPERTIES`  table to gather properties – therefore there can and will be different names for the same attributes.

If you want a cleaner dataset, use the `PROPERTIES`  table which contains the entries from the mapped dataset. But for example, the `symbol=AAPL`  information will be missing there.

For `ASSOCIATIONS`  vs `RAWASSOCIATIONS` , it is hard to tell. `Apple_Inc` . has more incoming associations in `RAWASSOCIATIONS` , but `Apple`  has less. Because further investigation was not possible, the prototype relies on the `ASSOCIATIONS`  table right now for the number of incoming associations (disambiguations) as well as the outgoing associations (enrichment).

## API

### Semantic Enrichment
The API for semantic enrichment consists of two xsjs files: ```describe.xsjs``` and ```enrich.xsjs``` The API can be called with a simple GET-request and will return a JSON result. The ```describe.xsjs``` gives back a list of all properties (attributes, outgoing associations, abstract) which are available in the database. With the ```enrich.xsjs``` one can retrieve the actual information stored in the database, with an optional filter if one is only interested in certain properties of an entity.

#### Entity Enrichment

`describe.xsjs?query=Apple`

**Return Values**

```
{
    "abstract": true,
    "thumbnail": true,
    "attributes": [{
        "type": "http%3A%2F%2Fdbpedia.org%2Fproperty%2Fname"
    }, ...],
    “outgoingAssociations”: []
}
```

`enrich.xsjs`

**Parameters**

```
{
    abstract: Give a query, // Mandatory
    filter: Filter the query with a JSON array
        /* 
        {“abstract”:true,”attributes”:[{“type”:”name”},..],..}
        default: {} [no filter]
        */
}
```

**Return Values**

```
{“
    abstract”: ”Apple is a company...”,
    ”attributes”: [{“
        type”: ”name”,
        “value”: ”Apple Inc.”
    }, ...],
    ”outgoingAssociations”: [...]
}
```



### Entity Disambiguation with Ranking

For entity disambiguation there is ```disambiguate.xsjs``` Again, the API takes a GET-request and returns the result in JSON format.

**Parameters**

```
{
    query: Give a query , // Mandatory
    entityMode: Switch between returning entities or categories {
        values: true or false
        default: true
    },
    limit: Limit for the algorithm(bigger = more results) {
        values: 1 - inf[int]
        default: 75
    },
    incomingNoWeight: Weight of the number of incoming associations of an entity(bigger means more weight) {
        values: +-inf[float]
        default: 0.15
    },
    orderWeight: Weight of more specific types(bigger means specific types are favored more) {
        values: +-inf[float]
        default: 0.1
    },
    fuzzy: Parameter for fuzzy search {
        values: 0 - 1.0[float]
        default: 1.0[no fuzzy search]
    },
    multilang: Search in INTERLANGUAGE table {
        values: true or false
        default: false
    },
    context: Give context as a JSON array {
        values: {
            context: [“entity”: ”SAP_AG”]
        }
        default: {}
    },
    verbose: Make the output more detailed {
        values: true or false
        default: false
    },
    openSearch: Used for SAPUI5 search suggestion {
        values: true or false
        default: false
    }
}
```

**Return Values**

Entity mode
`{"entities": [{"name":"Microsoft","score":0.9681761690228368},...]}`

Category mode
`{"types": [{"name":"Company","score":0.9681761690228368},...]}`


### Schema Matching

The ```matchTables.xsjs``` takes the cell values of two tables as JSON via POST and returns the matched columns with a score and suggested column names as JSON.

**Parameters**

```
{
    fuzzy: Parameters for fuzzy search {
        values: 0-1.0 [float],
        default: 1.0 [fuzzy disabled]
    },
    multilang: Search in INTERLANGUAGE table {
        values: true or false,
        default: false
    },
    debug: Returns information useful for debugging i.e. weighted types per cell
}
```

**Return Values**

```
{
    "matches": [
    {
        column1: 0,
        column2: 0,
        score: 0.627861,
        suggestedName: "Plant" 
    },{
        column1 :1,
        column2 :1,
        score: 0.868278,
        suggestedName: "Company" 
    },{
        column1: 2,
        column2: 2,
        score: 0.952602,
        suggestedName: "Country" 
    }]
}
```
