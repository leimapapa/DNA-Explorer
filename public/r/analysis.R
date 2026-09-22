suppressPackageStartupMessages({
  library(pedtools)
  library(forrel)
  library(ibdsim2)
})

run_profile_case <- function(profile_json, mode = "siblings") {
  started <- proc.time()[["elapsed"]]
  profile <- jsonlite::fromJSON(profile_json, simplifyDataFrame = TRUE)
  source_samples <- as.character(profile$samples)
  loci <- as.character(profile$loci)
  ids <- c("A", "B")
  rows <- profile$rows

  allele_matrix <- matrix(NA_character_, nrow = 2, ncol = 2 * length(loci),
                          dimnames = list(ids, as.vector(rbind(paste0(loci, ".1"), paste0(loci, ".2")))))
  for (sample_index in seq_along(source_samples)) {
    for (locus_index in seq_along(loci)) {
      row <- rows[rows$sample == source_samples[[sample_index]] & rows$locus == loci[[locus_index]], , drop = FALSE]
      allele_matrix[sample_index, 2 * locus_index - 1] <- as.character(row$allele1[[1]])
      allele_matrix[sample_index, 2 * locus_index] <- as.character(row$allele2[[1]])
    }
  }

  observed <- nuclearPed(children = ids)
  frequency_database <- forrel::NorwegianFrequencies
  locus_attributes <- lapply(seq_along(loci), function(index) {
    frequencies <- frequency_database[[loci[[index]]]]
    alleles <- unique(as.vector(allele_matrix[, c(2 * index - 1, 2 * index)]))
    if (is.null(frequencies)) {
      frequencies <- rep(1 / length(alleles), length(alleles))
      names(frequencies) <- alleles
      list(name = loci[[index]], alleles = alleles, afreq = frequencies)
    } else {
      list(name = loci[[index]], afreq = frequencies)
    }
  })
  observed <- setMarkers(observed, alleleMatrix = allele_matrix, locusAttributes = locus_attributes)

  genotype <- function(sample_index, locus_index) {
    paste(allele_matrix[sample_index, 2 * locus_index - 1],
          allele_matrix[sample_index, 2 * locus_index], sep = "/")
  }
  if (mode == "match") {
    match_lr_per_marker <- vapply(seq_along(loci), function(index) {
      first_genotype <- sort(allele_matrix[1, c(2 * index - 1, 2 * index)])
      second_genotype <- sort(allele_matrix[2, c(2 * index - 1, 2 * index)])
      if (!identical(first_genotype, second_genotype)) return(0)
      frequencies <- afreq(observed, marker = loci[[index]])
      a1 <- allele_matrix[1, 2 * index - 1]
      a2 <- allele_matrix[1, 2 * index]
      random_match <- if (a1 == a2) frequencies[[a1]]^2 else 2 * frequencies[[a1]] * frequencies[[a2]]
      1 / random_match
    }, numeric(1))
    locus_rows <- lapply(seq_along(loci), function(index) {
      list(locus = loci[[index]], personA = genotype(1, index), personB = genotype(2, index),
           fullSiblingLr = unname(match_lr_per_marker[[index]]), halfSiblingLr = 1)
    })
    lr <- prod(match_lr_per_marker)
    hypothesis_rows <- list(
      list(name = "Same person", lr = lr, log10Lr = log10(lr)),
      list(name = "Unrelated people", lr = 1, log10Lr = 0)
    )
    posterior_percent <- 100 * lr / (1 + lr)
    ibd_estimate <- NULL
    mean_shared <- NA_real_
    comparison_label <- "same-source match versus unrelated profiles"
  } else {
    half_siblings <- relabel(halfSibPed(), old = 4:5, new = ids)
    unrelated <- singletons(ids)
    lr_result <- kinshipLR(sib = observed, half = half_siblings, unrel = unrelated, ref = "unrel", verbose = FALSE)
    locus_rows <- lapply(seq_along(loci), function(index) {
      list(locus = loci[[index]], personA = genotype(1, index), personB = genotype(2, index),
           fullSiblingLr = unname(lr_result$LRperMarker[index, "sib:unrel"]),
           halfSiblingLr = unname(lr_result$LRperMarker[index, "half:unrel"]))
    })
    hypothesis_rows <- list(
      list(name = "Full siblings", lr = unname(lr_result$LRtotal[["sib:unrel"]]), log10Lr = log10(unname(lr_result$LRtotal[["sib:unrel"]]))),
      list(name = "Half siblings", lr = unname(lr_result$LRtotal[["half:unrel"]]), log10Lr = log10(unname(lr_result$LRtotal[["half:unrel"]]))),
      list(name = "Unrelated people", lr = 1, log10Lr = 0)
    )
    lr <- unname(lr_result$LRtotal[["sib:unrel"]])
    posterior_percent <- 100 * lr / (1 + lr)
    ibd <- as.data.frame(ibdEstimate(observed, ids = ids, verbose = FALSE))[1, ]
    ibd_estimate <- list(k0 = unname(ibd$k0), k1 = unname(ibd$k1), k2 = unname(ibd$k2), markersUsed = length(loci))
    mean_shared <- 100 * (ibd_estimate$k1 / 2 + ibd_estimate$k2)
    comparison_label <- "full-sibling relationship versus unrelated profiles"
  }
  elapsed <- (proc.time()[["elapsed"]] - started) * 1000

  payload <- list(
    engine = list(
      r = R.version.string,
      pedtools = as.character(packageVersion("pedtools")),
      forrel = as.character(packageVersion("forrel")),
      ibdsim2 = as.character(packageVersion("ibdsim2"))
    ),
    input = list(markerCount = length(loci), simulationCount = 0, seed = 0),
    hypotheses = hypothesis_rows,
    loci = locus_rows,
    segments = list(),
    simulations = list(),
    meanSharedPercent = mean_shared,
    elapsedMs = elapsed,
    source = "imported",
    sourceLabel = profile$name,
    ibdEstimate = ibd_estimate,
    mode = mode,
    posteriorPercent = posterior_percent,
    comparisonLabel = comparison_label
  )

  jsonlite::toJSON(payload, auto_unbox = TRUE, digits = 10, na = "null")
}

run_test_case <- function(marker_count, simulation_count, seed) {
  started <- proc.time()[["elapsed"]]
  ids <- c("A", "B")

  # pedtools: define the observed hypothesis and generate a deterministic,
  # synthetic marker panel for two full siblings.
  full_siblings <- nuclearPed(children = ids)
  full_siblings <- simpleSim(
    full_siblings,
    N = marker_count,
    alleles = 8:15,
    ids = ids,
    seed = seed
  )

  half_siblings <- relabel(halfSibPed(), old = 4:5, new = ids)
  unrelated <- singletons(ids)

  # forrel: compare both relationship hypotheses with unrelated people.
  lr_result <- kinshipLR(
    sib = full_siblings,
    half = half_siblings,
    unrel = unrelated,
    ref = "unrel"
  )

  alleles <- getAlleles(full_siblings, ids = ids)
  marker_names <- sub("\\.[12]$", "", colnames(alleles)[seq(1, ncol(alleles), 2)])
  marker_labels <- sprintf("SYN%02d", seq_along(marker_names))
  genotype <- function(person, index) {
    paste(alleles[person, 2 * index - 1], alleles[person, 2 * index], sep = "/")
  }

  locus_rows <- lapply(seq_len(marker_count), function(index) {
    list(
      locus = marker_labels[[index]],
      personA = genotype("A", index),
      personB = genotype("B", index),
      fullSiblingLr = unname(lr_result$LRperMarker[index, "sib:unrel"]),
      halfSiblingLr = unname(lr_result$LRperMarker[index, "half:unrel"])
    )
  })

  hypothesis_names <- c(
    sib = "Full siblings",
    half = "Half siblings",
    unrel = "Unrelated"
  )

  hypothesis_rows <- lapply(names(hypothesis_names), function(key) {
    result_name <- paste0(key, ":unrel")
    lr <- unname(lr_result$LRtotal[[result_name]])

    list(
      name = hypothesis_names[[key]],
      lr = lr,
      log10Lr = log10(lr)
    )
  })

  # ibdsim2: simulate chromosome 1 using the published decode19 map.
  chromosome_map <- loadMap("decode19", chrom = 1)
  simulations <- ibdsim(
    full_siblings,
    N = simulation_count,
    ids = ids,
    map = chromosome_map,
    seed = seed,
    verbose = FALSE,
    simplify1 = FALSE
  )

  first <- as.data.frame(simulations[[1]])
  segment_rows <- lapply(seq_len(nrow(first)), function(index) {
    list(
      startMb = unname(first$startMB[[index]]),
      endMb = unname(first$endMB[[index]]),
      startCm = unname(first$startCM[[index]]),
      endCm = unname(first$endCM[[index]]),
      ibd = unname(first$IBD[[index]])
    )
  })

  simulation_rows <- lapply(seq_along(simulations), function(index) {
    current <- as.data.frame(simulations[[index]])
    lengths <- current$endCM - current$startCM
    valid <- is.finite(lengths) & is.finite(current$IBD)
    lengths <- lengths[valid]
    states <- current$IBD[valid]
    total <- sum(lengths)
    ibd1 <- sum(lengths[states == 1])
    ibd2 <- sum(lengths[states == 2])
    shared_percent <- if (total > 0) 100 * sum(lengths * states) / (2 * total) else 0
    list(
      simulation = index,
      sharedPercent = shared_percent,
      ibd1Cm = ibd1,
      ibd2Cm = ibd2
    )
  })

  mean_shared <- mean(vapply(simulation_rows, function(x) x$sharedPercent, numeric(1)))
  elapsed <- (proc.time()[["elapsed"]] - started) * 1000

  payload <- list(
    engine = list(
      r = R.version.string,
      pedtools = as.character(packageVersion("pedtools")),
      forrel = as.character(packageVersion("forrel")),
      ibdsim2 = as.character(packageVersion("ibdsim2"))
    ),
    input = list(
      markerCount = marker_count,
      simulationCount = simulation_count,
      seed = seed
    ),
    hypotheses = hypothesis_rows,
    loci = locus_rows,
    segments = segment_rows,
    simulations = simulation_rows,
    meanSharedPercent = mean_shared,
    elapsedMs = elapsed
  )

  jsonlite::toJSON(payload, auto_unbox = TRUE, digits = 10, na = "null")
}
