import { useState, useEffect } from 'react';

function StudentsTable() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ name: '', email: '', course: '' });
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'http://localhost:5000/api/students';

  const fetchStudents = () => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setStudents(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/${editingId}` : API_URL;

    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm({ name: '', email: '', course: '' });
      setEditingId(null);
      fetchStudents();
    } catch (err) {
      alert('Failed to save student: ' + err.message);
    }
  };

  const handleEdit = (student) => {
    setForm({ name: student.name, email: student.email, course: student.course });
    setEditingId(student.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      fetchStudents();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleCancel = () => {
    setForm({ name: '', email: '', course: '' });
    setEditingId(null);
  };

  if (loading) return <p>Loading students...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>{editingId ? 'Edit Student' : 'Add New Student'}</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
          style={{ marginRight: '8px', padding: '6px' }}
        />
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{ marginRight: '8px', padding: '6px' }}
        />
        <input
          name="course"
          placeholder="Course"
          value={form.course}
          onChange={handleChange}
          required
          style={{ marginRight: '8px', padding: '6px' }}
        />
        <button type="submit">{editingId ? 'Update' : 'Add'}</button>
        {editingId && (
          <button type="button" onClick={handleCancel} style={{ marginLeft: '8px' }}>
            Cancel
          </button>
        )}
      </form>

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Course</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.id}</td>
              <td>{student.name}</td>
              <td>{student.email}</td>
              <td>{student.course}</td>
              <td>
                <button onClick={() => handleEdit(student)}>Edit</button>
                <button onClick={() => handleDelete(student.id)} style={{ marginLeft: '6px' }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentsTable;