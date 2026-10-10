---
title: DLSYS3 神经网络
date: 2026-10-10
updated: 2026-10-10
description: CMU10-414 Lecture 3
category: Tech
showOnHome: true
tags:
  - CMU10-414
  - 机器学习
draft: true
series: CMU10-414 ML系统
seriesIndex: 3
---
如果数据在原始输入空间里不是线性可分的，我们就需要学习非线性特征。线性假设类具有以下形式：

$$h_\theta(x) = \theta^T x,\quad \theta \in \mathbb{R}^{n\times k}$$

对于一个输入 $x \in \mathbb{R}^n$ ，模型会产生 $k$ 个输出 logits。当类别可以用线性决策边界分开时，这样做是可行的，但当类别结构是非线性的时候，就行不通了。例如下图的结构：

![|600](https://cdn.jsdelivr.net/gh/D1rection/img@main/images/20261010231150503.png)

问题在于假设类（hypothesis class）：线性模型在原始特征空间里只能表达线性边界。

一种让线性模型更具表达力的方式是对原始输入做特征映射（相关可参见[[2026-10-09-001#1. Feature maps|核技巧]]）。如下式：

$$h_\theta(x) = \theta^T \phi(x)$$


此处，$\phi(x)$ 是一个特征映射。如果 $\phi$ 能把原始输入映射成一个更好的表示，那么在 $\phi(x)$  之上加一个线性分类器，就能解决那些在原始输入空间里本来是非线性的问题。但如果这个特征映射只是线性映射，并且后面仍接一个线性模型，那么整体依然是线性的，因此不会增加模型的表达能力。例如：

$$\phi(x) = W^T x$$

那么有：

$$h_\theta(x) = \theta^T \phi(x) = \theta^T (W^T x) = (\theta^T W^T) x$$

可见，把多个线性层堆叠起来，最终还是会合并成一个线性层，所以这个模型依然没法表示非线性的决策边界。为了让模型具备非线性的表达能力，我们应插入一个非线性激活函数：

$$\phi(x) = \sigma(W^T x)$$

那么有

$$h_\theta(x) = \theta^T \sigma(W^T x)$$

- 在随机傅里叶特征方法（RFF）中， $W$ 等参数随机采样后固定，即固定的非线性特征。
- 在神经网络中：从数据中学习 $W$，即可学习的非线性特征。

## 1. 神经网络

神经网络就是由一堆带参数的可微函数的组合。

## 参考

1. https://ickma2311.github.io/ML/DLSys/cmu-dlsys-lecture-3-manual-neural-networks.html