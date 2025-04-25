const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(express.static('public'))
app.use(cors({origin: '*'}));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/admin.html')
})

const PORT = 3030;

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs')

// Swagger документация
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Task Management API',
            version: '1.0.0',
            description: 'API для управления задачами',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
            },
        ],
    },
    apis: ['openapi.yaml'], // укажите путь к файлам с аннотациями
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


// Middleware для парсинга JSON
app.use(bodyParser.json());


// Получить список данных
app.get('/products', (req, res) => {
    fs.readFile('./data.json', 'utf-8', function(err, data) {
        if (err) throw err

        let jsonData = JSON.parse(data);
        res.json(jsonData.products);
    });
});

app.get('/categories', (req, res) => {
    fs.readFile('./data.json', 'utf-8', function(err, data) {
        if (err) throw err

        let jsonData = JSON.parse(data);
        res.json(jsonData.categories);
    });
});

// Создать новый объект
app.post('/products', (req, res) => {
    const { name, price, description, categoryIds } = req.body;
    const newProduct = {
        id: 0,
        name: name,
        price: price,
        description: description,
        categoryIds: categoryIds,
    };
    fs.readFile('./data.json', 'utf-8', function(err, data) {
        if (err) throw err

        let jsonData = JSON.parse(data);
        if (categoryIds.some((el) => jsonData.categories.find(t => parseInt(t.id) === parseInt(el)) === undefined)) {
            res.status(404).json({ message: 'Category not found.' });
            return;
        }
        newProduct.id = jsonData.products.length + 1;
        jsonData.products.push(newProduct);
        fs.writeFile('./data.json', JSON.stringify(jsonData), 'utf-8', function(err) {
            if (err) throw err;
        });
    });
    res.status(201).json(newProduct);
});
app.post('/categories', (req, res) => {
    const { name } = req.body;
    const newCategory = {
        id: 0,
        name: name,
    };
    fs.readFile('./data.json', 'utf-8', function(err, data) {
        if (err) throw err

        let jsonData = JSON.parse(data);
        newCategory.id = jsonData.categories.length + 1;
        jsonData.categories.push(newCategory);
        fs.writeFile('./data.json', JSON.stringify(jsonData), 'utf-8', function(err) {
            if (err) throw err;
        });
    });
    res.status(201).json(newCategory);
});

// Обновить объекты по ID
app.put('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    fs.readFile('./data.json', 'utf-8', function(err, data) {
        if (err) throw err

        let jsonData = JSON.parse(data);
        const product = jsonData.products.find(t => t.id === productId);
        if (product) {
            const { name, price, description, categoryIds } = req.body;
            product.name = name !== undefined ? name : product.title;
            product.price = price !== undefined ? price : product.price;
            product.description = description !== undefined ? description : product.description;
            product.categoryIds = categoryIds !== undefined ? categoryIds : product.categoryIds;
            if (categoryIds.some((el) => jsonData.categories.find(t => parseInt(t.id) === parseInt(el)) === undefined)) {
                res.status(404).json({ message: 'Category not found.' });
                return;
            }
            fs.writeFile('./data.json', JSON.stringify(jsonData), 'utf-8', function(err) {
                if (err) throw err;
            });
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    });
});

app.put('/categories/:id', (req, res) => {
    const categoryId = parseInt(req.params.id);
    fs.readFile('./data.json', 'utf-8', function(err, data) {
        if (err) throw err

        let jsonData = JSON.parse(data);
        const category = jsonData.categories.find(t => t.id === categoryId);
        if (category) {
            const { name } = req.body;
            category.name = name !== undefined ? name : category.title;
            fs.writeFile('./data.json', JSON.stringify(jsonData), 'utf-8', function(err) {
                if (err) throw err;
            });
            res.json(category);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    });
});

// Удалить объект по ID
app.delete('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    fs.readFile('./data.json', 'utf-8', function(err, data) {
        if (err) throw err

        let jsonData = JSON.parse(data);
        jsonData.products = jsonData.products.filter(t => t.id !== productId);
        fs.writeFile('./data.json', JSON.stringify(jsonData), 'utf-8', function(err) {
            if (err) throw err;
        });
    });
    res.status(204).send();
});

app.delete('/categories/:id', (req, res) => {
    const categoryId = parseInt(req.params.id);
    fs.readFile('./data.json', 'utf-8', function(err, data) {
        if (err) throw err

        let jsonData = JSON.parse(data);
        jsonData.products = jsonData.products.filter(t => !t.categoryIds.includes(categoryId));
        jsonData.categories = jsonData.categories.filter(t => t.id !== categoryId);
        fs.writeFile('./data.json', JSON.stringify(jsonData), 'utf-8', function(err) {
            if (err) throw err;
        });
    });
    res.status(204).send();
});

// GraphQL
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

const schema = buildSchema(`
    type Product {
        id: ID!
        name: String!
        price: Int!
        description: String!
        categoryIds: [Int]
    }
    type Category {
        id: ID!
        name: String!
        products: [Product]
    }
    
    type Query {
        categories: [Category]
    }
`);

class Product {
    constructor({ id, name, price, description }) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.description = description;
    }
}

class Category {
    constructor({ id, name, products }) {
        this.id = id;
        this.name = name;
        this.products = products;
    }
}

let root = {
    categories: () => {
        let data;
        try {
            data = fs.readFileSync('./data.json', 'utf-8');
        } catch (err) {
            console.error(err);
        }

        let jsonData = JSON.parse(data);
        let result = [];
        for (const category of jsonData.categories) {
            let categoryJson = new Category(category);
            categoryJson.products = [];
            for (const product of jsonData.products) {
                for (const categoryId of product.categoryIds) {
                    if (categoryId === category.id) {
                        categoryJson.products.push(new Product(product));
                        break;
                    }
                }
            }
            result.push(categoryJson);
        }
        return result;
    },
}

app.use(
    '/graphql',
    graphqlHTTP({
        schema: schema,
        rootValue: root,
        graphiql: true,
    }),
);

// Запуск сервера
app.listen(PORT, () => {
    console.log("Server is running on http://localhost:", PORT);
});