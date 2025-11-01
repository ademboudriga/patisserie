// 📁 src/controllers/FactureController.js
const FactureModel = require('../models/FactureModel');

/**
 * Contrôleur pour les factures
 * Gère la logique métier et les appels au modèle
 */

// === GET toutes les factures avec filtres et pagination ===
const getAllFactures = async (req, res) => {
  try {
    const { client, date, startDate, endDate, page = 1, limit = 10 } = req.query;
    const filters = { client, date, startDate, endDate, page: parseInt(page), limit: parseInt(limit) };

    const { factures, total, page: currentPage, limit: currentLimit } = FactureModel.getAllFactures(filters);

    res.status(200).json({
      success: true,
      data: factures,
      pagination: {
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit)
      },
      message: 'Factures récupérées avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures',
      error: error.message
    });
  }
};

// === GET une facture par ID ===
const getFactureById = async (req, res) => {
  try {
    const { id } = req.params;
    const facture = FactureModel.getFactureById(id);
    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }
    const produits = FactureModel.getProduitsByFactureId(id);
    res.status(200).json({
      success: true,
      data: { ...facture, produits },
      message: 'Facture récupérée avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la facture',
      error: error.message
    });
  }
};

// === POST créer une nouvelle facture ===
const createFacture = async (req, res) => {
  try {
    const factureData = req.body;
    const newFacture = FactureModel.createFacture(factureData);
    res.status(201).json({
      success: true,
      data: newFacture,
      message: 'Facture créée avec succès'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création de la facture',
      error: error.message
    });
  }
};

// === PUT mettre à jour une facture ===
const updateFacture = async (req, res) => {
  try {
    const { id } = req.params;
    const factureData = req.body;
    const updatedFacture = FactureModel.updateFacture(id, factureData);
    if (!updatedFacture) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }
    res.status(200).json({
      success: true,
      data: updatedFacture,
      message: 'Facture mise à jour avec succès'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la facture',
      error: error.message
    });
  }
};

// === DELETE supprimer une facture ===
const deleteFacture = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = FactureModel.deleteFacture(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Facture supprimée avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la facture',
      error: error.message
    });
  }
};

// === POST ajouter un produit à une facture ===
const addProduitToFacture = async (req, res) => {
  try {
    const { id } = req.params; // facture_id
    const produitData = req.body;
    const newProduit = FactureModel.addProduitToFacture(id, produitData);
    res.status(201).json({
      success: true,
      data: newProduit,
      message: 'Produit ajouté à la facture avec succès'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de l\'ajout du produit à la facture',
      error: error.message
    });
  }
};

// === GET produits d'une facture ===
const getProduitsByFactureId = async (req, res) => {
  try {
    const { id } = req.params;
    const produits = FactureModel.getProduitsByFactureId(id);
    res.status(200).json({
      success: true,
      data: produits,
      message: 'Produits récupérés avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits',
      error: error.message
    });
  }
};

// === DELETE supprimer un produit d'une facture ===
const deleteProduitFromFacture = async (req, res) => {
  try {
    const { produitId } = req.params;
    const deleted = FactureModel.deleteProduitFromFacture(produitId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Produit supprimé de la facture avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du produit',
      error: error.message
    });
  }
};

// === Export des contrôleurs ===
module.exports = {
  getAllFactures,
  getFactureById,
  createFacture,
  updateFacture,
  deleteFacture,
  addProduitToFacture,
  getProduitsByFactureId,
  deleteProduitFromFacture
};