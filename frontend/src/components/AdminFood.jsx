import React, { useState, useEffect } from "react";
import axios from "axios";
import './AdminFood.css'; 

const AdminFoods = () => {
  const [foods, setFoods] = useState([]);
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "food",
    image: "",
  });
  const [file, setFile] = useState(null);

  // Fetch foods
  const fetchFoods = async () => {
    const res = await axios.get("http://localhost:5001/api/foods");
    setFoods(res.data);
  };

  useEffect(() => {
    fetchFoods();
  }, []);


  // Add food
  const handleSubmit = async (e) => {
    e.preventDefault();
    try{
      const data = new FormData();
      data.append("name", form.name);
      data.append("price", form.price);
      data.append("category", form.category);

      if (file) {
        data.append("image", file);
      }

      await axios.post("http://localhost:5001/api/foods/add",data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setForm({ name:"", price: "", category: "food" });
      setFile(null);
      fetchFoods();
    } catch(err) {
      console.error(err);
    }
  };


  // Delete food
  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:5001/api/foods/${id}`);
    fetchFoods();
  };

  return (
    <div className="admin-foods">
      <h2>Manage Foods & Drinks</h2>
      <form onSubmit={handleSubmit} className="food-form">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="food">Food</option>
          <option value="drink">Drink</option>
        </select>
        <input
          type="file"
          name="image"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
        
        <button type="submit">Add Item</button>
      </form>

      <h3>Food & Drinks List</h3>
      <div className="foods-list">
        {foods.map((item) => (
          <div key={item._id} className="food-card">
            {item.image && <img src={`http://localhost:5001${item.image}`} alt={item.name} />}
            <h4>{item.name}</h4>
            <p>Rs. {item.price}</p>
            <p>Category: {item.category}</p>
            <button onClick={() => handleDelete(item._id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminFoods;
