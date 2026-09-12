import { useEffect, useState } from 'react';
import './App.css';

interface Product {
  id?: number;
  name: string;
  category: string;
  price: number;
  score?: number;
}

const API = '/api';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  // форма создания
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');

  const loadAll = async () => {
    const res = await fetch(`${API}/products`);
    setProducts(await res.json());
  };

  useEffect(() => {
    loadAll();
  }, []);

  // поиск с debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const res = await fetch(`${API}/products/search?q=${encodeURIComponent(query)}`);
      setResults(await res.json());
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !price) return;
    await fetch(`${API}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, price: Number(price) }),
    });
    setName('');
    setCategory('');
    setPrice('');
    loadAll();
  };

  return (
    <div className="app">
      <h1>🛍️ DevStack Store</h1>
      <p className="sub">PostgreSQL + Elasticsearch + NestJS + React</p>

      <section className="card">
        <h2>🔍 Умный поиск (fuzzy)</h2>
        <input
          className="search"
          placeholder="Попробуй с опечаткой: iphon, samsng, laptp..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {searching && <p className="hint">Ищу...</p>}
        {query && !searching && (
          <p className="hint">Найдено: {results.length}</p>
        )}
        <div className="grid">
          {results.map((p, i) => (
            <div className="product" key={i}>
              <strong>{p.name}</strong>
              <span className="cat">{p.category}</span>
              <span className="price">${p.price}</span>
              {p.score !== undefined && (
                <span className="score">score: {p.score.toFixed(2)}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>➕ Добавить товар</h2>
        <form className="form" onSubmit={createProduct}>
          <input placeholder="Название" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Категория" value={category} onChange={(e) => setCategory(e.target.value)} />
          <input placeholder="Цена" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          <button type="submit">Создать</button>
        </form>
      </section>

      <section className="card">
        <h2>📦 Все товары ({products.length})</h2>
        <div className="grid">
          {products.map((p) => (
            <div className="product" key={p.id}>
              <strong>{p.name}</strong>
              <span className="cat">{p.category}</span>
              <span className="price">${p.price}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
