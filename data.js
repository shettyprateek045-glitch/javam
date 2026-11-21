// Original data from examoptima_50_sample_students (1).csv (unchanged)
const ORIGINAL_STUDENTS = [
  {
    "id": "STU001",
    "usn": "1RN26CS001",
    "name": "Aarav Sharma",
    "department": "CSE",
    "semester": 3,
    "email": "aarav.sharma01@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU002",
    "usn": "1RN26CS002",
    "name": "Aditi Rao",
    "department": "CSE",
    "semester": 3,
    "email": "aditi.rao02@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU003",
    "usn": "1RN26CS003",
    "name": "Akash Patil",
    "department": "CSE",
    "semester": 3,
    "email": "akash.patil03@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU004",
    "usn": "1RN26CS004",
    "name": "Ananya Kumar",
    "department": "CSE",
    "semester": 3,
    "email": "ananya.kumar04@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU005",
    "usn": "1RN26CS005",
    "name": "Arjun Shetty",
    "department": "CSE",
    "semester": 3,
    "email": "arjun.shetty05@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU006",
    "usn": "1RN26CS006",
    "name": "Bhavana Reddy",
    "department": "CSE",
    "semester": 3,
    "email": "bhavana.reddy06@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU007",
    "usn": "1RN26CS007",
    "name": "Charan Nair",
    "department": "CSE",
    "semester": 3,
    "email": "charan.nair07@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU008",
    "usn": "1RN26CS008",
    "name": "Diya Gowda",
    "department": "CSE",
    "semester": 3,
    "email": "diya.gowda08@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU009",
    "usn": "1RN26CS009",
    "name": "Gagan Iyer",
    "department": "CSE",
    "semester": 3,
    "email": "gagan.iyer09@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU010",
    "usn": "1RN26CS010",
    "name": "Harini Kulkarni",
    "department": "CSE",
    "semester": 3,
    "email": "harini.kulkarni10@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU011",
    "usn": "1RN26DS001",
    "name": "Ishaan Sharma",
    "department": "CSE (Data Science)",
    "semester": 3,
    "email": "ishaan.sharma11@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU012",
    "usn": "1RN26DS002",
    "name": "Kavya Rao",
    "department": "CSE (Data Science)",
    "semester": 3,
    "email": "kavya.rao12@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU013",
    "usn": "1RN26DS003",
    "name": "Kiran Patil",
    "department": "CSE (Data Science)",
    "semester": 3,
    "email": "kiran.patil13@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU014",
    "usn": "1RN26DS004",
    "name": "Lakshmi Kumar",
    "department": "CSE (Data Science)",
    "semester": 3,
    "email": "lakshmi.kumar14@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU015",
    "usn": "1RN26DS005",
    "name": "Manoj Shetty",
    "department": "CSE (Data Science)",
    "semester": 3,
    "email": "manoj.shetty15@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU016",
    "usn": "1RN26DS006",
    "name": "Meera Reddy",
    "department": "CSE (Data Science)",
    "semester": 3,
    "email": "meera.reddy16@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU017",
    "usn": "1RN26DS007",
    "name": "Nikhil Nair",
    "department": "CSE (Data Science)",
    "semester": 3,
    "email": "nikhil.nair17@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU018",
    "usn": "1RN26DS008",
    "name": "Pooja Gowda",
    "department": "CSE (Data Science)",
    "semester": 3,
    "email": "pooja.gowda18@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU019",
    "usn": "1RN26DS009",
    "name": "Pranav Iyer",
    "department": "CSE (Data Science)",
    "semester": 3,
    "email": "pranav.iyer19@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU020",
    "usn": "1RN26DS010",
    "name": "Priya Kulkarni",
    "department": "CSE (Data Science)",
    "semester": 3,
    "email": "priya.kulkarni20@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU021",
    "usn": "1RN26IS001",
    "name": "Rahul Sharma",
    "department": "Information Science and Engineering",
    "semester": 3,
    "email": "rahul.sharma21@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU022",
    "usn": "1RN26IS002",
    "name": "Riya Rao",
    "department": "Information Science and Engineering",
    "semester": 3,
    "email": "riya.rao22@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU023",
    "usn": "1RN26IS003",
    "name": "Rohan Patil",
    "department": "Information Science and Engineering",
    "semester": 3,
    "email": "rohan.patil23@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU024",
    "usn": "1RN26IS004",
    "name": "Sahana Kumar",
    "department": "Information Science and Engineering",
    "semester": 3,
    "email": "sahana.kumar24@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU025",
    "usn": "1RN26IS005",
    "name": "Sanjay Shetty",
    "department": "Information Science and Engineering",
    "semester": 3,
    "email": "sanjay.shetty25@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU026",
    "usn": "1RN26IS006",
    "name": "Shreya Reddy",
    "department": "Information Science and Engineering",
    "semester": 3,
    "email": "shreya.reddy26@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU027",
    "usn": "1RN26IS007",
    "name": "Sneha Nair",
    "department": "Information Science and Engineering",
    "semester": 3,
    "email": "sneha.nair27@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU028",
    "usn": "1RN26IS008",
    "name": "Tanvi Gowda",
    "department": "Information Science and Engineering",
    "semester": 3,
    "email": "tanvi.gowda28@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU029",
    "usn": "1RN26IS009",
    "name": "Varun Iyer",
    "department": "Information Science and Engineering",
    "semester": 3,
    "email": "varun.iyer29@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU030",
    "usn": "1RN26IS010",
    "name": "Vijay Kulkarni",
    "department": "Information Science and Engineering",
    "semester": 3,
    "email": "vijay.kulkarni30@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU031",
    "usn": "1RN26EC001",
    "name": "Adarsh Sharma",
    "department": "Electronics and Communication Engineering",
    "semester": 3,
    "email": "adarsh.sharma31@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU032",
    "usn": "1RN26EC002",
    "name": "Anil Rao",
    "department": "Electronics and Communication Engineering",
    "semester": 3,
    "email": "anil.rao32@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU033",
    "usn": "1RN26EC003",
    "name": "Deepa Patil",
    "department": "Electronics and Communication Engineering",
    "semester": 3,
    "email": "deepa.patil33@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU034",
    "usn": "1RN26EC004",
    "name": "Divya Kumar",
    "department": "Electronics and Communication Engineering",
    "semester": 3,
    "email": "divya.kumar34@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU035",
    "usn": "1RN26EC005",
    "name": "Ganesh Shetty",
    "department": "Electronics and Communication Engineering",
    "semester": 3,
    "email": "ganesh.shetty35@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU036",
    "usn": "1RN26EC006",
    "name": "Hemanth Reddy",
    "department": "Electronics and Communication Engineering",
    "semester": 3,
    "email": "hemanth.reddy36@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU037",
    "usn": "1RN26EC007",
    "name": "Keerthi Nair",
    "department": "Electronics and Communication Engineering",
    "semester": 3,
    "email": "keerthi.nair37@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU038",
    "usn": "1RN26EC008",
    "name": "Madhav Gowda",
    "department": "Electronics and Communication Engineering",
    "semester": 3,
    "email": "madhav.gowda38@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU039",
    "usn": "1RN26EC009",
    "name": "Nandini Iyer",
    "department": "Electronics and Communication Engineering",
    "semester": 3,
    "email": "nandini.iyer39@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU040",
    "usn": "1RN26EC010",
    "name": "Pavan Kulkarni",
    "department": "Electronics and Communication Engineering",
    "semester": 3,
    "email": "pavan.kulkarni40@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU041",
    "usn": "1RN26EE001",
    "name": "Raksha Sharma",
    "department": "Electrical and Electronics Engineering",
    "semester": 3,
    "email": "raksha.sharma41@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU042",
    "usn": "1RN26EE002",
    "name": "Siddharth Rao",
    "department": "Electrical and Electronics Engineering",
    "semester": 3,
    "email": "siddharth.rao42@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU043",
    "usn": "1RN26EE003",
    "name": "Sowmya Patil",
    "department": "Electrical and Electronics Engineering",
    "semester": 3,
    "email": "sowmya.patil43@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU044",
    "usn": "1RN26EE004",
    "name": "Tejas Kumar",
    "department": "Electrical and Electronics Engineering",
    "semester": 3,
    "email": "tejas.kumar44@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU045",
    "usn": "1RN26EE005",
    "name": "Uday Shetty",
    "department": "Electrical and Electronics Engineering",
    "semester": 3,
    "email": "uday.shetty45@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU046",
    "usn": "1RN26EE006",
    "name": "Vaishnavi Reddy",
    "department": "Electrical and Electronics Engineering",
    "semester": 3,
    "email": "vaishnavi.reddy46@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU047",
    "usn": "1RN26EE007",
    "name": "Yash Nair",
    "department": "Electrical and Electronics Engineering",
    "semester": 3,
    "email": "yash.nair47@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU048",
    "usn": "1RN26EE008",
    "name": "Zoya Gowda",
    "department": "Electrical and Electronics Engineering",
    "semester": 3,
    "email": "zoya.gowda48@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU049",
    "usn": "1RN26EE009",
    "name": "Abhishek Iyer",
    "department": "Electrical and Electronics Engineering",
    "semester": 3,
    "email": "abhishek.iyer49@example.edu",
    "subject": "25BCSIC302"
  },
  {
    "id": "STU050",
    "usn": "1RN26EE010",
    "name": "Chaitra Kulkarni",
    "department": "Electrical and Electronics Engineering",
    "semester": 3,
    "email": "chaitra.kulkarni50@example.edu",
    "subject": "25BCSIC302"
  }
];
