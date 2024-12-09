const { ApolloServer, gql } = require("apollo-server");
const express = require("express");
const bodyParser = require("body-parser");
const { graphqlHTTP } = require("express-graphql");
const swaggerUi = require("swagger-ui-express");

// Base de datos simulada
let productsDb = [
  { id: 1, name: "T-shirt", description: "Cotton T-shirt", price: 20.5, tax: 2.0 },
  { id: 2, name: "Shoes", description: "Sport shoes", price: 50.0, tax: 5.0 },
];

// Esquema GraphQL
const typeDefs = gql`
  type Product {
    id: Int!
    name: String!
    description: String
    price: Float!
    tax: Float
  }

  type Query {
    getProducts: [Product!]!
    getProductById(id: Int!): Product
  }

  type Mutation {
    createProduct(name: String!, description: String, price: Float!, tax: Float): Product!
  }
`;

const resolvers = {
  Query: {
    getProducts: () => productsDb,
    getProductById: (_, { id }) => productsDb.find((product) => product.id === id),
  },
  Mutation: {
    createProduct: (_, { name, description, price, tax }) => {
      const newProduct = { id: productsDb.length + 1, name, description, price, tax };
      productsDb.push(newProduct);
      return newProduct;
    },
  },
};

// Crear servidor GraphQL
const graphqlServer = new ApolloServer({ typeDefs, resolvers });
graphqlServer.listen(4000).then(({ url }) => {
  console.log(`🚀 Servidor GraphQL ejecutándose en ${url}`);
});

// Crear un servidor REST con Express
const app = express();
app.use(bodyParser.json());

// Definir rutas para el proxy REST
app.get("/rest/products", (req, res) => {
  res.json(productsDb);
});

app.get("/rest/products/:id", (req, res) => {
  const product = productsDb.find((p) => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

app.post("/rest/products", (req, res) => {
  const { name, description, price, tax } = req.body;
  const newProduct = { id: productsDb.length + 1, name, description, price, tax };
  productsDb.push(newProduct);
  res.status(201).json(newProduct);
});

// Documentar con Swagger
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Product API (GraphQL Proxy)",
    version: "1.0.0",
    description: "API REST que actúa como proxy para la API GraphQL de productos.",
  },
  paths: {
    "/rest/products": {
      get: {
        summary: "Obtiene todos los productos",
        responses: {
          "200": {
            description: "Lista de productos",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" }, description: { type: "string" }, price: { type: "number" }, tax: { type: "number" } } },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Crea un nuevo producto",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  price: { type: "number" },
                  tax: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Producto creado",
          },
        },
      },
    },
    "/rest/products/{id}": {
      get: {
        summary: "Obtiene un producto por ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
          },
        ],
        responses: {
          "200": {
            description: "Producto encontrado",
          },
          "404": {
            description: "Producto no encontrado",
          },
        },
      },
    },
  },
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Iniciar servidor REST
app.listen(3000, () => {
  console.log("Servidor REST ejecutándose en http://localhost:3000");
  console.log("Documentación Swagger en http://localhost:3000/api-docs");
});
