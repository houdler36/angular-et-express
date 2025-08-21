const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurez le stockage de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Créez le répertoire 'public/uploads/signatures' s'il n'existe pas
    const uploadPath = path.join(__dirname, '../..', 'public/uploads/signatures');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Créez un nom de fichier unique pour éviter les collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Le fichier n\'est pas une image !'), false);
  }
};

// Créez l'instance Multer pour un seul fichier 'signature'
exports.upload = multer({ storage: storage, fileFilter: fileFilter }).single('signature');

// Contrôleur pour gérer l'upload
exports.uploadSignature = (req, res) => {
  if (req.file) {
    const imageUrl = `/uploads/signatures/${req.file.filename}`;
    res.status(200).json({
      message: "Signature téléchargée avec succès.",
      url: imageUrl
    });
  } else {
    res.status(400).json({
      message: "Aucun fichier de signature n'a été téléchargé."
    });
  }
};
